const Account = require("../models/Account")


const getUserById = async(req,res) => {
    const userId = req.params;
    if (userId != null){
        try{
            const user = await Account.getUserByUserId(userId);
            if(user != null){
                console.log(JSON.stringify(user,null,2));
                const {userId,email,registeredDate,role} = user;
                return res.status(200).json({"message": "Retrieved the user sucessfully", "userInformation": {
                    "userId": userId,
                    "email":email,
                    "registeredDate":registeredDate,
                    "userRole":role
                }})
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
    const {uuid} = req.params;
    const userId = uuid.split(":")[1]
    console.log(userId)
    const {newRole} = req.body
    console.log(newRole);
    if (userId && newRole != null){
        // call the async function
        try {
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

module.exports = {
    getUserById,
    getUserByEmail,
    editUserRole
}