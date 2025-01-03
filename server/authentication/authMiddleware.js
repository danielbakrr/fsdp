// Import the necessary libs for using STS assume role command and get the IAM user
const bcrypt = require('bcrypt');
const { IAMClient, GetUserCommand } = require("@aws-sdk/client-iam");
const { dynamoDb } = require('../awsConfig');
const {stsClient} = require('../awsConfig');
const {iamClient} = require('../awsConfig');
const Account = require('../Account');
// Export the account class 
const { 
    AssumeRoleCommand 
} = require("@aws-sdk/client-sts");

const {
    ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const login = async(req,res) => {
    // get the user with the password and generate the JWT Token 
    // Add 2FA (MFA) when logging in 
    const {email,password} = req.body;
    try {
        const user = await Account.getUser(email);
        if (user != null){
            // Check the password of the user 
            const isMatch = bcrypt.compare(password,user.hashedPassword);
            if (isMatch){
                // retrieve the IAM user from aws 
                const command = new GetUserCommand({
                    UserName: user.email
                })
                const response = await iamClient.send(command);
                const iamUser = response.User;
                if (!iamUser){
                    return res.status(401).send('The user is not an IAM user');
                }
                // assume role with the user's access key id and secret access key
                var accessKeyId, secretAccessKey;
                switch (user.role){
                    case 'Admin':
                        // Admin role 
                        // Assume the sts role 
                        const input = {
                            RoleArn: 'arn:aws:iam::050752642849:role/Admin',
                            RoleSessionName: `${iamUser.userEmail}-session`,
                            Tags: [
                                {
                                    Key: 'IamUserArn',
                                    Value: iamUser.Arn
                                }
                            ]
                        }
                        const stsResponse = await stsClient.send(new AssumeRoleCommand(input));
                        accessKeyId = stsResponse.Credentials.AccessKeyId;
                        secretAccessKey = stsResponse.Credentials.SecretAccessKey;
                        break

                    case 'Operator':
                        break
                    case 'User':
                        break
                    default:
                        break
                }
                // Process info to send in JWT payload 
                if (accessKeyId == null || secretAccessKey == null){
                    res.status(401).json({
                        message: 'The user is not an IAM user or does not have access to assume the IAM role',
                        timestamp: new Date().toISOString()
                    })
                }
                else {
                    // send the JWT payload to the user 
                    const payload = {
                        role: user.role,
                        iamAccessKeyId: accessKeyId,
                        iamSecreatAccessKeyId: secretAccessKey
                    }
                    const token = jwt.sign(payload, secretKey, { expiresIn: "3600s" }); // Expires in 1 hour (automaticallt logsout user after the session of 1 hour exceeded)
                    res.status(200).json({
                        'message' : `${user.role} has sucessfully logged in`,
                        'jwtToken' : token
                    })
                }
            }
            else {
                return res.status(401).send('Incorrect Password has been entered');
            }
            
        }
        else{
            res.status(404).send('Email of the user is invalid or does not exists');
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

// create a normal sign up method 
const signUp = async (req,res) => {
    const {userID,createdDate,email,firstName,lastName} = req.body;
    // hash the password 
    const hashedPassword = await bcrypt.hash(password,10);

    const newUser = Account(userID,createdDate,email,hashedPassword,firstName,lastName);
    try {
        const response = await Account.createUser(newUser);
        if (response.$metadata.httpStatusCode === 200){
            return res.status(200).json({
                'message' : 'User has been created successfully',
                'user' : newUser
            })
        }
        else {
            return res.status(response.$metadata.httpStatusCode).json({
                'message' : 'User has not been created successfully',
                'user' : newUser
            })
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

}

module.exports = {
    login,
    signUp
}