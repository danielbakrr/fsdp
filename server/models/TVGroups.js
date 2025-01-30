const { dynamoDb } = require("../awsConfig");
const {
  ScanCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

class TVGroup {
  // Fetch all TV groups
  static async getAllTVGroups() {
    const params = {
      TableName: "TVGroups",
    };
    try {
      const data = await dynamoDb.send(new ScanCommand(params));
      return data.Items;
    } catch (error) {
      console.error("Error fetching TVGroups:", error);
      throw new Error("Unable to fetch TVGroups");
    }
  }

  // Fetch TVGroups by ID
  static async getTVGroupsById(groupID) {
    const params = {
      TableName: "TVGroups",
      Key: { groupID },
    };
    try {
      const data = await dynamoDb.send(new GetCommand(params));
      return data.Item;
    } catch (error) {
      console.error("Error fetching TV Groups:", error);
      throw new Error("Unable to fetch TV Groups");
    }
  }
  F;

  // Add a new TVGroup
  static async addTVGroup(TVGroupData) {
    const params = {
      TableName: "TVGroups",
      Item: TVGroupData,
    };
    try {
      await dynamoDb.send(new PutCommand(params));
    } catch (error) {
      console.error("Error adding TV Group:", error);
      throw new Error("Unable to add TV Group");
    }
  }

// Update the name of the TV group by ID
static async updateTVGroup(groupID, newGroupName) {
    const params = {
      TableName: "TVGroups",
      Key: { groupID },
      UpdateExpression: "SET groupName = :newName",
      ExpressionAttributeValues: {
        ":newName": newGroupName,
      },
      ReturnValues: "UPDATED_NEW",
    };
  
    try {
      const data = await dynamoDb.send(new UpdateCommand(params));
      console.log("DynamoDB response:", data); // Log the full response for debugging
      return data.Attributes; // Return the updated attributes
    } catch (error) {
      console.error("Error updating TV Group:", error);
      throw new Error("Unable to update TV Group");
    }
  }
  

  // Delete a TVGroup by ID
  static async deleteTVGroup(groupID) {
    const params = {
      TableName: "TVGroups",
      Key: { groupID },
    };
    try {
      await dynamoDb.send(new DeleteCommand(params));
    } catch (error) {
      console.error("Error deleting TV Group:", error);
      throw new Error("Unable to delete TV Group");
    }
  }
}

module.exports = TVGroup;
