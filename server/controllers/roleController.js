const {Role} = require("../models/role");

const createRole = async (req,res) => {
    const {roleName,permissions} = req.body;
    try {
        const newRole = new Role(roleName,permissions);
        const roleCreated = await Role.createRole(newRole);
        console.log(JSON.stringify(roleCreated,null,2));
        // roleCreated 
        if (roleCreated.$metadata.httpStatusCode == 200){
            return res.status(200).json({"message": "Role has been created successfully", "newRole": newRole})
        }
        else{
            return res.status(404).json({"message": "Unable to create the role"});
        }
    
    }
    catch (err){
        console.error(err);
        return res.status(500).send("Internal server error");
    }
}

// controller for editing the role permissions 

const getPermissions = async(req,res) => {
    const roleName = req.params.roleId;
    console.log(roleName);
    if (roleName != null){
        const rolePermissions = await Role.getPermissions(roleName);
        console.log(JSON.stringify(rolePermissions,null,2));
        if (rolePermissions){
            return res.status(200).json({"message":"role permission of the user have been successful","rolePermissions":rolePermissions})
        }
        else {
            return res.status(404).json({"message":"Unable to retrieve permissions for the user"})
        }
    }
    else {
        return res.status(400).send("Request is malformed please enter the correct details");
    }
}

module.exports = {
    createRole,
    getPermissions
}