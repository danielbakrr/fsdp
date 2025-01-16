// Import the necessary libs for using STS assume role command and get the IAM user
const bcrypt = require('bcrypt');
const Account = require('../Account');
const {Role} = require('../role');
const {jwt} = require("jsonwebtoken");
const { json } = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const dotenv = require("dotenv")
// Export the account class 
dotenv.config();
const login = async(req,res) => {
    // get the user with the password and generate the JWT Token 
    // Add 2FA (MFA) when logging in 
    const {email,password} = req.body;
    try {
        const user = await Account.getUser(email);
        // retrieve the user details 
        if (!user){
            return res.status(401).json({"message": "Invalid credentials"});
        }

        const isMatch = await bcrypt.compare(password,user.hashedPassword);
        if (!isMatch){
            return res.status(401).json({"message":"Invalid Password"});
        }

        // retirive the corresponding role by user's uuIDv4
        const userRole = await Account.getRole(user.userId);
        if (userRole != null){
            // retrieve the corresponding role's permissions
            const permissions = Role.getPermissions(userRole);
            const payload = {
                "userId": user.userId,
                "role": user.role,
                "permissions": permissions
            }
            // jwt sign 
            const accessToken = jwt.sign(process.env.JWT_SECRET,payload);
            res.status(200).json({message: "The user has sucessfully logged in",token:accessToken});
        }
        
 
    }
    catch (err){
        console.errror(err);
        return res.status(500).send("Internal Server Error");
    }
}

// create a normal sign up method 
const signUp = async (req,res) => {
    console.log(req.body);
    const {email,firstName,lastName,password} = req.body;
    try {
        const userId = uuidv4();
        const registeredDate = new Date().toISOString();
        // hash the password 
        const hashedPassword = await bcrypt.hash(password,10);
    
        const newUser = new Account(userId, registeredDate, email, hashedPassword, firstName, lastName,"role");
        console.log(JSON.stringify(newUser,null,2));
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