const { dynamoDb } = require('../awsConfig');
const { ScanCommand, PutCommand, DeleteCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
class Advertisement{
    // constructor for advertisements 
    constructor(adID,adTitle,adContent,adType,uploadDate,assignedTvs,FileId){
        this.adID = adID;
        this.adTitle = adTitle;
        this.adType = adType;
        this.adContent = adContent;
        this.uploadDate = uploadDate;
        this.assignedTvs =  assignedTvs;
        this.FileId = FileId
    } 
    
    // Methods for the advertisements table 
    static async createAd(Advertisement){
        const params = {
            TableName: "Advertisement",
            Item: Advertisement
        }
        try {
            const data = await dynamoDb.send(new PutCommand(params));
            return data;
        }
        catch (err){
                console.error(err);
                return null;
        }
    }

    static async deleteAd(adID){
        const params = {
            TableName: "Advertisement",
            Key:{
                "adID" : adID
            },

        }
        try{
            const data = await dynamoDb.send(new DeleteCommand(params));
            return data;

        }

        catch(err){
            console.error(err);
            return null
        }
    }

    static async addTv(tvID,adID){
        console.log(tvID);
        const params = {
            // So now basically add the tvIDs to the assignedTvs array
            TableName: "Advertisement",

            // Specify the partition key / primary key u are targeting
            Key:{
                "adID":adID,
            },
            // UpdateExpression (to update the attribute in the table)
            UpdateExpression: "set assignedTvs = list_append(assignedTvs, :tvID)",
            ExpressionAttributeValues:{
                ":tvID": [tvID]
            },
            ReturnValues:"UPDATED_NEW" // Return the updated value
        }
        try{
            const data = await dynamoDb.send(new UpdateCommand(params));
            return data;
        }

        catch(err){
            console.error(err);
            return null
        }
    }

    static async retireveAllAds(){
        const params = {
            TableName: "Advertisement"
        }
        
        try{
            const data = await dynamoDb.send(new ScanCommand(params));
            return data;
        }

        catch(err){
            console.error(err);
            return null
        }
    }

    static async retireveAd(adID){
        console.log(adID);
        const params = {
            TableName: "Advertisement",
            Key:{
                "adID" : adID
            }
            
        }

        try{
            const data = await dynamoDb.send(new GetCommand(params));
            if (data) {
                console.log("Item found:", data);
                return data.Item; // Return the item if found
            } else {
                console.log("Item not found for adID:", adID);
                return null;
            }
        }

        catch(err){
            console.error(err);
            return null
        }
    }
    
    static async retrieveAdByAdID(fileID) {
        console.log(fileID);
        const params = {
            TableName: "Advertisement",  // Replace with your table name
            FilterExpression: "#fileId = :fileId",  // Filter for items where fileId matches the provided value
            ExpressionAttributeNames: {
                "#fileId": "fileId",  // Map fileId in case it's a reserved word
            },
            ExpressionAttributeValues: {
                ":fileId": fileIdValue,  // The value of fileId you're searching for
            },
            ProjectionExpression: "adId, fileId"  // Retrieve only the adId and fileId attributes
        };
        try {
            const data = await dynamoDb.send(new ScanCommand(params));  // Send Scan command
            console.log(data);

            // Check if data.Items is empty
            if (!data.Items || data.Items.length === 0) {
                console.log("No items found with the given fileID.");
                return null;  // Return null if no items are found
            }

            return data.Items;  // Return the matching items
        } catch (error) {
            console.error("Error retrieving ad by fileID:", error);
            return null;  // Return null if there's an error during the scan
        }
    }


}


// Export the advertisment class
module.exports = Advertisement;