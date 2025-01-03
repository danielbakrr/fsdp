const {dynamoDb} = require('./awsConfig')
const {PutCommand, ScanCommand} = require('@aws-sdk/lib-dynamodb')
class Account {
    constructor(userId, createdDate, email, hashedPassword, firstName, lastName){
        this.userId = userId;
        this.createdDate = createdDate;
        this.email = email;
        this.hashedPassword = hashedPassword;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    static async createUser(User){
        const params = {
            TableName: 'Users',
            Item: {
                userId: User.userId,
                createdDate: User.createdDate,
                email: User.email,
                hashedPassword: User.hashedPassword,
                firstName: User.firstName,
                lastName: User.lastName,
            }
        }
        try{
            const response = await dynamoDb.send(PutCommand(params));
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

}

module.exports = Account;