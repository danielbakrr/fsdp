// method for retrieving role
const { PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const {dynamoDb} = require("./awsConfig");



// method for updating the role
class Role {
    constructor(roleId,permissions,roleName){
        this.roleId = roleId,
        this.permissions = permissions,
        this.roleName = roleName
    }
    // give them least privilleged permissions for roles

    static async createRole(role){
       const {roleId,permissions,roleName} = role // role is a js object
       const formattedPermissions = {
            L: permissions.map((perm) => ({
                M: {
                    Actions: {
                        L: perm.Actions.map((action) => ({ S: action })), // Convert each action to { S: "value" }
                    },
                    resource: {
                        S: perm.resource, // Convert resource to { S: "value" }
                    },
                },
            })),
       };    
       const params = {
        TableName: "Roles",
        Item:{
            "roleId":{
                "S":roleId,
            },
            "permissions": formattedPermissions,
            "roleName":{
                "S":roleName
            }
        }
       }
       const command = new PutItemCommand(params);
       const result = await dynamoDb.send(command);
       return result

    }

    static async editPermissions(permissions,roleId){
        const params = {
            TableName: Roles,
            Key: roleId,
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

    static async getPermissions(roleId){
        const params = {
            TableName: "Roles",
            Key: roleId,
        }
        const result = await dynamoDb.send(new GetItemCommand(params));
        // the returned result is items followed by something else 
        const permissions = result.Item.permissions.L;
        console.log(JSON.stringify(permissions, null, 2))
        if(Array.isArray(permissions)){
            let denormalizedpermissions = []
            // then we start to denormalize the permissions
            permissions.map((perm) =>{
                console.log(JSON.stringify(perm.M.Actions,null,2));
                const actions = [];
                perm.M.Actions.L.forEach(element => {
                    actions.push(element.S);
                });
                const resource = perm.M.resource.S;
                denormalizedpermissions.push({actions,resource});
            })
            
            const res = {
                "roleId": roleId,
                "permissions": denormalizedpermissions,
                "roleName": result.Item.roleName.S
            }

            return res;
        }
    }
    

}

module.exports = {
    Role
}