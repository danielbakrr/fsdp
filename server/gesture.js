const express = require("express");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const router = express.Router();

// Initialize DynamoDB Client
const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

router.post("/store-gesture", async (req, res) => {
    const { gesture } = req.body;

    if (!gesture) {
        return res.status(400).json({ error: "Gesture is required" });
    }

    const timestamp = new Date().toISOString();
    const params = {
        TableName: "Gestures", // Ensure this matches your actual DynamoDB table name
        Item: {
            id: `${gesture}-${timestamp}`,
            gesture: gesture,
            timestamp: timestamp,
        },
    };

    try {
        await ddbDocClient.send(new PutCommand(params));
        console.log(`Stored gesture: ${gesture}`);
        res.status(200).json({ message: "Gesture stored successfully!" });
    } catch (error) {
        console.error("Error storing gesture:", error);
        res.status(500).json({ error: "Could not store gesture" });
    }
});

module.exports = router;
