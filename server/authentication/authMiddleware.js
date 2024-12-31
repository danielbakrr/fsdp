// Import the necessary libs for using STS assume role command and get the IAM user
const bcrypt = require('bcrypt');
const { IAMClient, GetUserCommand } = require("@aws-sdk/client-iam");
const { dynamoDb } = require('./awsConfig');
const { 
    STSClient, 
    AssumeRoleCommand 
} = require("@aws-sdk/client-sts");

const {
    ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const login = async(req,res) => {
    // get the user with the password and generate the JWT Token 
    // Add 2FA (MFA) when logging in 
    const {email,password} = req.body;
    // get the user from the dynamoDB database 
    const params = {
        TableName: 'users',
        FilterExpression: 'email = :email AND password = :password',
        ExpressionAttributeValues: {
            ':email': email,
            ':hashedPassword': password
        }
    };

    try {
        const user = await dynamoDb.send(new ScanCommand(params));
        if (user != null){
            // Check the password of the user 
            const isMatch = bcrypt.compare(password,user.hashedPassword);
            if (isMatch){
                // retrieve the IAM user from aws 
                const command = new GetUserCommand({
                    UserName: user.email
                })
                const client = new IAMClient();
                const response = await client.send(command);
                // assume role with the user's access key id and secret access key
                var accessKeyId, secretAccessKey;
                switch (user.role){
                    case 'Admin':
                        // Admin role 
                        // Assume the sts role 
                        const input = {
                            RoleArn: 'arn:aws:iam::050752642849:role/Admin',
                            RoleSessionName: 'default'
                        }

                        const stsClient = new STSClient();
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
                        'message' : `${user.role} has sucessfully logged in`
                    })
                }
            }
            
        }
        else{
            res.status(401).send('Invalid credentials');
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

// create a normal sign up method 
const signUp = async (req,res) => {
    const {email,password,role} = req.body;
    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // create the user in the dynamoDB database
    const params = {
        TableName: 'users',
        Item: {
            email: email,
            password: hashedPassword,
            role: role
        }
    };
    try {
        const command = new PutCommand(params);
        const response = await dynamoDb.send(command);
        res.status(201).json({
            message: 'User created successfully',
            timestamp: new Date().toISOString()
        });
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