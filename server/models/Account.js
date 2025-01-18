const { QueryCommand, DynamoDBServiceException, GetItemCommand, ReturnValue, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const {dynamoDb} = require('../awsConfig')
const {PutCommand, ScanCommand, DeleteCommand} = require('@aws-sdk/lib-dynamodb')
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
                "userId": userId
            }
        }
        try{
            const getUserResponse = await dynamoDb.send(new GetItemCommand(params));
            if(getUserResponse != null){
                // create the user to a new User object and return in in the request 
                const userDetails = getUserResponse.Item;
                const user = new Account 
                    (userDetails.userId,
                    userDetails.registeredDate,
                    userDetails.email,
                    userDetails.role,
                    userDetails.firstName,
                    userDetails.lastName,
                    userDetails.hashedPassword)
                return user;
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
        // UpdateItemCommand, specify which attributes to update based on the key of the attribute then 
        // insert new value and specify whether to replace (overwrite) -> PUT
        const params = {
            TableName: "Users",
            Key: {
                "userId": userId
            },
            AttributeUpdate: {
                "role": {
                    Value: newRole,
                    Action: "ADD"
                }
            },
            ReturnValue: "ALL_NEW"
        }
        try{
            const updatedUser = await dynamoDb.send(new UpdateItemCommand(params));
            console.log(JSON.stringify(updatedUser));
            if(updatedUser.Attributes != null){
                const updatedAttribute = updatedUser.Attributes.role.S;
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


}

module.exports = Account;