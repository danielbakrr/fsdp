const { QueryCommand } = require('@aws-sdk/client-dynamodb');
const {dynamoDb} = require('./awsConfig')
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
                createdDate: User.createdDate,
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

    static async getUser(email){
        const params = {
            TableName: 'Users',
            FilterExpression: "email = :email AND password = :password"
        }
        try {
            const response = await dynamoDb.send(ScanCommand(params));
            return response.Items[0] || null;
        }
        catch (err){
            console.log(err);
        }
    }

    static async getRole(userId){
        const params = {
            TableName: "Users",
            // Use alias to compare
            KeyConditionExpression: 'userId = :partKeyVal',
            // Define the alias value 
            ExpressionAttributeValues:{
                ':partitionKeyVal': userId
            },
            ProjectionExpression: 'role'
        }
        try {
            const response = await dynamoDb.send(QueryCommand(params));
            return response.Item[0] || null;
        }
        catch (err){
            console.log(err);
        }
    }

    



}

module.exports = Account;