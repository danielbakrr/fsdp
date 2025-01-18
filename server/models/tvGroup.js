const { dynamoDb } = require('./awsConfig');
const { ScanCommand, PutCommand, DeleteCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
class tvGroup{
    constructor(groupID,tv,createdDate,Demographics,GroupName,Location,status){
        this.groupID = groupID;
        this.createdDate = createdDate;
        this.Demographics = Demographics;
        this.Location = Location;
        this.GroupName = GroupName;
    }

    static createTvGroup = async (tvGroup) => {
        const params = {
            TableName: "tvGroup",
            Item: tvGroup
        }

        try{
            const data = await dynamoDb.send(new PutCommand(params));
            
            if (!data){
                return null;
            }

            return data.$metadata;
        }

        catch (err){
            console.log(error);
            return null;
        }
    }

    static deleteTvGroup = async (groupID) => {
        const params = {
            TableName: "tvGroup",
            Key: {
                groupID: groupID
            }
        }

        try{
            const data = await dynamoDb.send(new DeleteCommand(params));

            if (!data){
                return null;
            }

            return data;
        }

        catch (err){
            console.log(error);
            return null;
        }
    }

    static updateTvGroup = async (tvGroup) => {
        const params = {
            TableName: "tvGroup",
            Item: tvGroup
        }

        try{
            const data = await dynamoDb.send(new UpdateCommand(params));

            if (!data){
                return null;
            }

            return data;
        }

        catch (err){
            console.log(error);
            return null;
        }
    }
 
    static filterByLocation = async (Location) => {
        const params = {
            TableName: "tvGroup",
            FilterExpression: "Location = :Location",
            ExpressionAttributeValues: {
                ":Location": Location
            }
        }

        try{
            const data = await dynamoDb.send(new ScanCommand(params));

            if (!data){
                return null;
            }

            return data.Items;
        }

        catch (err){
            console.log(error);
            return null;
        }
    }

    static filterByDemographic = async (Demographics) => {
        const params = {
            TableName: "tvGroup",
            FilterExpression: "Demographics = :Demographics",
            ExpressionAttributeValues: {
                ":Demographics": Demographics
            }
        }

        try{
            const data = await dynamoDb.send(new ScanCommand(params));

            if (!data){
                return null;
            }

            return data.Items;
        }

        catch (err){
            console.log(err);
            return null;
        }
    }

    static addTvToGroup = async (groupID, tv) => {
        const params = {
            TableName: "tvGroup",
            Key: {
                groupID: groupID
            },
            UpdateExpression: "SET tv = list_append(tv, :tv)",
            ExpressionAttributeValues: {
                ":tv": [tv]
            }
        }

        try{
            const data = await dynamoDb.send(new UpdateCommand(params));

            if (!data){
                return null;
            }

            return data;
        }

        catch (err){
            console.log(err);
            return null;
        }
    }

}