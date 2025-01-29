const { dynamoDb } = require("../awsConfig");
const {
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  PutCommand,
  BatchWriteCommand,
} = require("@aws-sdk/lib-dynamodb");

class TVs {
  // Get all TVs by groupID
  static async getAllTvs(groupID) {
    const params = {
      TableName: "TVs",
      KeyConditionExpression: "groupID = :groupID",
      ExpressionAttributeValues: {
        ":groupID": groupID,
      },
    };

    try {
      const data = await dynamoDb.send(new QueryCommand(params));
      return data.Items;
    } catch (error) {
      throw new Error(`Error fetching TVs for group: ${error.message}`);
    }
  }

  // Get a TV by groupID and tvID
  static async getTvById(groupID, tvID) {
    const params = {
      TableName: "TVs",
      KeyConditionExpression: "groupID = :groupID and tvID = :tvID",
      ExpressionAttributeValues: {
        ":groupID": groupID,
        ":tvID": tvID,
      },
    };

    try {
      const data = await dynamoDb.send(new QueryCommand(params));
      return data.Items[0];
    } catch (error) {
      throw new Error(`Error fetching TV by ID: ${error.message}`);
    }
  }

  // Add a new TV
  static async addTv(tvData) {
    const params = {
      TableName: "TVs",
      Item: tvData,
    };

    try {
      await dynamoDb.send(new PutCommand(params));
    } catch (error) {
      throw new Error(`Error adding TV: ${error.message}`);
    }
  }

  // Delete a TV by groupID and tvID
  static async deleteTv(groupID, tvID) {
    if (!groupID || !tvID) {
      throw new Error("Both groupID and tvID are required to delete a TV.");
    }
    const params = {
      TableName: "TVs",
      Key: {
        groupID: groupID,
        tvID: tvID,
      },
    };
    try {
      await dynamoDb.send(new DeleteCommand(params));
    } catch (error) {
      throw new Error(`Error deleting TV: ${error.message}`);
    }
  }

  // Delete batch tvs
  static async deleteTvs(groupID, tvIds) {
    const deleteRequests = tvIds.map((tvID) => ({
      DeleteRequest: {
        Key: {
          groupID: groupID,
          tvID: tvID,
        },
      },
    }));

    const params = {
      RequestItems: {
        TVs: deleteRequests,
      },
    };

    try {
      await dynamoDb.send(new BatchWriteCommand(params));
    } catch (error) {
      throw new Error(`Error deleting TVs: ${error.message}`);
    }
  }

  // Update ad content for a TV by groupID and tvId
  static async updateAdForTv(groupID, tvID, adID) {
    const params = {
      TableName: "TVs",
      Key: {
        groupID: groupID,
        tvID: tvID,
      },
      UpdateExpression: "SET adID = :adID",
      ExpressionAttributeValues: {
        ":adID": adID,
      },
    };

    try {
      await dynamoDb.send(new UpdateCommand(params));  // Using PUTCommand instead of UpdateCommand
      return { message: "Advertisement updated successfully" };
    } catch (error) {
      throw new Error(`Error updating ad content for TV: ${error.message}`);
    }
  }

  // Update batch tvs
  static async updateBatchTvs(groupID, tvIds, adID) {
    const updateRequests = tvIds.map((tvID) => ({
      PutRequest: {
        Item: { groupID, tvID, adID},
      },
    }));

    const params = {
      RequestItems: {
        TVs: updateRequests,
      },
    };
    try {
      await dynamoDb.send(new BatchWriteCommand(params));
    } catch (error) {
      throw new Error(`Error updating TVs: ${error.message}`);
    }
  }
}

module.exports = TVs;
