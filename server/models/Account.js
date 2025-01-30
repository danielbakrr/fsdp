const { QueryCommand,GetItemCommand,UpdateItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const {dynamoDb} = require('../awsConfig')
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const {PutCommand, ScanCommand} = require('@aws-sdk/lib-dynamodb')
class Account {
    constructor(userId, registeredDate, email, hashedPassword, firstName, lastName,role){
        this.userId = userId;
        this.registeredDate = registeredDate;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role
        this.hashedPassword = hashedPassword;

    }

    static async createUser(User){
        const params = {
            TableName: 'Users',
            Item: { 
                userId: User.userId,
                registeredDate: User.registeredDate,
                email: User.email,
                firstName: User.firstName,
                lastName: User.lastName,
                role: User.role,
                hashedPassword: User.hashedPassword,

            }
        }
        try{
            const response = await dynamoDb.send(new PutCommand(params));
            return response;
        }
        catch (err){
            console.log(err);
        }

    }

    static async getAllUsers(){
        const params = {
            TableName: "Users",
        }
        try {
            const scanCommandOutput = await dynamoDb.send(new ScanCommand(params));
            console.log(scanCommandOutput);
            if (scanCommandOutput.Items.length != 0){
                return scanCommandOutput.Items.map((item) => {
                    return {
                        "userId": item.userId,
                        "userName": `${item.firstName} ${item.lastName}`,
                        "email": item.email,
                        "role": item.role
                    }
                })
            }
            else {
                return null;
            }
        }
        catch (err){
            console.error(err);
        }
        
    }

    static async getUserByEmail(email){
        const params = {
            TableName: 'Users',
            FilterExpression: "email = :email",
            ExpressionAttributeValues: {
                ":email": email,       // Replace with the email you want to filter
            },
        }
        try {
            const response = await dynamoDb.send(new ScanCommand(params));
            if(response.Items[0] != null){
                const user = response.Items[0];
                console.log(JSON.stringify(user,null,2));
                return user;
            }
            else {
                return null;
            }
        }
        catch (err){
            console.log(err);
        }
    }

    static async getUserByUserId(userId){
        const params = {
            TableName: "Users",
            Key: {
                userId: marshall(userId)
            }
        }
        try{
            const getUserResponse = await dynamoDb.send(new GetItemCommand(params));
            
            if(getUserResponse.Item != undefined){
               const denormalisedResponse = unmarshall(getUserResponse.Item);
               console.log(denormalisedResponse);
               return denormalisedResponse;
            }
            else {
                return null;
            }
        }
        catch(err){
            console.error(err);
            return err;
        }
    }

    static async getRole(userId){
        const params = {
            TableName: "Users",
            // Use alias to compare
            KeyConditionExpression: 'userId = :partKeyVal',
            // Define the alias value 
            ExpressionAttributeValues:{
                ':partKeyVal': userId
            },
            ProjectionExpression: 'role'
        }
        try {
            const response = await dynamoDb.send(new QueryCommand(params));
            return response.Item[0].role.S || null;
        }
        catch (err){
            console.log(err);
        }
    }

    static async editUserRole(userId,newRole){
        console.log(userId);
        console.log(newRole);
        // UpdateItemCommand, specify which attributes to update based on the key of the attribute then 
        // insert new value and specify whether to replace (overwrite) -> PUT
        const params = {
            TableName: "Users",
            Key: {
                userId: marshall(userId) // Assuming `userId` is a string
            },
            UpdateExpression: "SET #role = :newRole",
            ExpressionAttributeNames: {
                "#role": "role" // Alias for the attribute name
            },
            ExpressionAttributeValues: {
                ":newRole": marshall(newRole) // Assuming `newRole` is a string
            },
            ReturnValues: "UPDATED_NEW" // Correct parameter name
        };
        try{
            const updatedUser = await dynamoDb.send(new UpdateItemCommand(params));
            console.log(JSON.stringify(updatedUser));
            if(updatedUser.Attributes != null){
                const updatedAttribute = unmarshall(updatedUser.Attributes)
                console.log(updatedAttribute);
                return updatedAttribute
            }
            else {
                return null;
            }
        }
        catch (err){
            console.error(err);
            return null;
        }

    }

    static async deleteUser(userId){
        const params = {
            TableName: 'Users',
            Key:{
                userId:marshall(userId),
            },
            ReturnValues: "ALL_OLD"
        }

        try {
            const deleteUser = await dynamoDb.send(new DeleteItemCommand(params));
            return deleteUser.Attributes.email.S || null;
        }

        catch(err){
            console.log(err);
            return null;
        }
    }


}

module.exports = Account;