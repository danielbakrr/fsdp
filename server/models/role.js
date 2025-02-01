// method for retrieving role
const { PutItemCommand, GetItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const {dynamoDb} = require("../awsConfig");



// method for updating the role
class Role {
    constructor(roleName,permissions){
        this.roleName = roleName,
        this.permissions = permissions
    }
    // give them least privilleged permissions for roles
    
    /*This function has already been tested */
    static async createRole(role){
       console.log(JSON.stringify(role,null,2));
       const {roleName, permissions} = role // role is a js object
       console.log(JSON.stringify(permissions,null,2));
       const formattedPermissions = {
            L: permissions.map((perm) => ({
                M: {
                    actions: {
                        L: perm.actions.map((action) => ({ S: action })), // Convert each action to { S: "value" }
                    },
                    resource: {
                        S: perm.resource, // Convert resource to { S: "value" }
                    },
                    ...(perm.tvGroupIds?.length > 0 ? {  // ternary operator to check if perm.tvIds exists and perm.tvIds.length > 0
                        tvGroupIds: { SS: perm.tvGroupIds } 
                    } : {})
                    
                },
            })),
       };
       console.log(formattedPermissions);
       const params = {
        TableName: "Roles",
        Item:{
            "roleName":{
                "S":roleName,
            },
            "permissions": formattedPermissions,
        }
       }
       const command = new PutItemCommand(params);
       const result = await dynamoDb.send(command);
       return result

    }
    // May not need as can just create a new role 
    static async editPermissions(permissions,roleName){
        const params = {
            TableName: "Roles",
            Key: roleName,
            Item: {
                "permissions":{
                    "M": permissions
                }
            },
            UpdateExpression: "set permissions = :permissions",
            ExpressionAttributeValues:{
                ":permissions" : "permissions"
            },
            ReturnValues: "ALL_NEW"
        }
        const result = await dynamoDb.send(new UpdateCommand(params));
        return result;
    }
    // Function has been tested 
    static async getPermissions(roleName){
        console.log(roleName);
        const params = {
            TableName: "Roles",
            Key:{
                roleName: { S: roleName }
            }
            
        }
        const result = await dynamoDb.send(new GetItemCommand(params));
        // the returned result is items followed by something else 
        const permissions = result.Item.permissions.L;
        if(Array.isArray(permissions)){
            let denormalizedpermissions = []
            // then we start to denormalize the permissions
            permissions.map((perm) =>{
                console.log(JSON.stringify(perm.M.actions,null,2));
                const actions = [];
                perm.M.actions.L.forEach(element => {
                    actions.push(element.S);
                });
                const resource = perm.M.resource.S;
                console.log(resource);
                const tvGroupIds = perm.M.tvGroupIds?.SS;  // Default to an empty array if tvIds or SS is undefined
                console.log(tvGroupIds);
                denormalizedpermissions.push({actions,resource,tvGroupIds});
            })
            
            const res = {
                "roleName": roleName,
                "permissions": denormalizedpermissions,
            }

            return res;
        }
    }

    // Function to getAllRoles from the role table 
    static async getAllRoles(){
        const params = {
            TableName: "Roles",
            ProjectionExpression: "roleName"
        }
        const result = await dynamoDb.send(new ScanCommand(params));
        console.log(JSON.stringify(result,null,2));
        if (result.Items.length > 0){
            // paerse the result 
            return result.Items.map((row)=>{
                const role = row.roleName.S;
                console.log(role);
                return role; // add role to result now (map basically creates a new array )
            });
        }
        else{
            return null;
        }
    }
    

}

module.exports = {
    Role
}