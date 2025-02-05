const express = require("express");
const router = express.Router();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    ScanCommand,
    UpdateCommand,
    GetCommand,
    PutCommand
} = require("@aws-sdk/lib-dynamodb");

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

const ADS_TABLE = process.env.DYNAMODB_TABLE_ADVERTISEMENTS;
const METRICS_TABLE = "Metrics"; 

// increment like count
router.post("/api/store-gesture", async (req, res) => {
    const { adID } = req.body;

    if (!adID) {
        return res.status(400).json({ error: "adID is required" });
    }

    try {
        
        const getParams = {
            TableName: METRICS_TABLE,
            Key: { adID },
        };

        const adData = await ddbDocClient.send(new GetCommand(getParams));

        let updatedLikes = 1; 

        if (adData.Item) {
            updatedLikes = (adData.Item.likes || 0) + 1;
        }

        
        const putParams = {
            TableName: METRICS_TABLE,
            Item: {
                adID,
                likes: updatedLikes, 
            },
        };

        await ddbDocClient.send(new PutCommand(putParams));

        res.status(200).json({ message: "Like recorded successfully", likes: updatedLikes });
    } catch (error) {
        console.error("Error storing like:", error);
        res.status(500).json({ error: "Could not store like" });
    }
});


router.get("/api/get-metrics", async (req, res) => {
    try {

        const likeParams = {
            TableName: METRICS_TABLE,
        };
        const likeData = await ddbDocClient.send(new ScanCommand(likeParams));

        const likeCounts = {};
        likeData.Items.forEach(item => {
            likeCounts[item.adID] = item.likes || 0;
        });

        const adParams = {
            TableName: ADS_TABLE,
        };
        const adData = await ddbDocClient.send(new ScanCommand(adParams));

        const adsWithLikes = adData.Items.map(ad => ({
            adID: ad.adID,
            adName: ad.adTitle || "Unnamed Ad",
            likes: likeCounts[ad.adID] || 0, 
        }));

        res.json(adsWithLikes);
    } catch (error) {
        console.error("Error fetching advertisement metrics:", error);
        res.status(500).json({ error: "Failed to retrieve metrics" });
    }
});

module.exports = router;
