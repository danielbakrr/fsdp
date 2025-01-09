// Import the necessary libs for using STS assume role command and get the IAM user
const bcrypt = require('bcrypt');
const Account = require('../Account');
const {Role} = require('../role');
const {jwt} = require("jsonwebtoken")
// Export the account class 
dotenv.config();
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
                // get the permissions now 
                const permissions = Role.getPermissions(user.roleId)
                // Then retrieve their corresponding role
                if(!permissions){
                    res.status(404).json({
                        "message": "The user has no role permissions"
                    })
                }
                else{
                     // sign jwt with payload of permissions 
                    const payload = {
                        "userName": user.userName,
                        "permissions" : permissions.permissions
                    }
                    const accessToken = jwt.sign(process.env.JWT_SECRET,payload)
                    res.status(201).send(accessToken);
                }

            }
            else{
                res.status(404).json({
                    "message": "The user does not exists"
                })
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