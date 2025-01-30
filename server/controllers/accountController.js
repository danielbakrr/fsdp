const { NIL } = require("uuid");
const Account = require("../models/Account")

const getUserById = async(req,res) => {
    const userId = req.params.uuid;
    console.log(userId)
    if (userId != null){
        try{
            const user = await Account.getUserByUserId(userId);
            console.log(user);
            if(user != null){
                const {userId,email,registeredDate,role} = user;
                return res.status(200).json({"message": "Retrieved the user sucessfully", "userInformation": {
                    "userId": userId,
                    "email":email,
                    "registeredDate":registeredDate,
                    "userRole":role
                }})
            }
            else {
                res.status(500).send("Internal server error");
            }
        }

        catch(err){
            console.error(err);
            return res.status(500).send(err);
        }
    }
    else{
        return res.status(404).send("Unable to locate user with the user id in the database")
    }
}


const getUserByEmail = async (req,res) => {
    console.log(req.body);
    const {email} = req.body;
    if(email != null){
        try{
            const retrievedUser = await Account.getUserByEmail(email);
            if(retrievedUser != null){
                const {userId} = retrievedUser;
                console.log(userId);
                return res.status(200).json({"message": `User with email: ${email} has a user id of: ${userId}`,"userId":userId})
            }
            else{
               return res.status(404).send("User does not exists");
            }
        }
        catch(err){
            console.error(err);
        }
    }
    else {
        return res.status(400).send("Request is malformed");
    }
}


// For getUserRole we are only using it when the person's logs in and since its already defined as asynchronus we won't immediately retrieve the data in dynamdb until the 
// promise is resolved 

const editUserRole = async(req,res) => {
    const userId = req.params.uuid;
    const newRole = req.body.role;
    if (userId && newRole != null){
        // call the async function
        try {
            console.log(userId);
            console.log(newRole);
            const roleUpdateResult = await Account.editUserRole(userId,newRole);
            console.log(roleUpdateResult);
            if (roleUpdateResult == null){
                return res.status(404).send("Unable to update the role as the user does not exists");
            }
            else {
                // Sucessful response from the server 
                return res.status(200).send(`The new role for the user is ${newRole}`);
            }
        }

        catch(err){
            console.error(err);
        }
    }
}
 
const getAllUsers = async(req,res) => {
    try {
        const retrievedUsers = await Account.getAllUsers();
        if (!retrievedUsers){
            return res.status(404).send("There are no users in the database");
        }
        else {
            return res.status(200).json({"message":"Sucessfully retrieved all users", "retrievedUsers": retrievedUsers});
        }
    }
    catch(err){
        console.error(err);
        res.status(500).send("Internal server error");
    }
}

const deleteUser = async (req,res) => {
    const userId = req.params.uuid;
    if (userId != null){
        try {
            const deletedUser = await Account.deleteUser(userId);
            console.log(deletedUser);
            if(deletedUser != null){
                return res.status(200).send(`The user with email ${deletedUser} has been sucessfully removed`);
            }
            else {
                return res.status(404).send("Unable to find the requested user please select an existing user")
            }
        }

        catch (err){
            console.error(err);
            return res.status(500).send("Internal server error");
        }
    }
}
module.exports = {
    getUserById,
    getUserByEmail,
    editUserRole,
    getAllUsers,
    deleteUser
}