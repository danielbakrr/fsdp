const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const { dynamoDb } = require("./awsConfig");
const multer = require("multer");
const sharp = require("sharp");
const { Server } = require("socket.io");
const http = require("http");
const bodyParser = require("body-parser");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const TVGroupController = require("./controllers/tvGroupController");
const TVController = require("./controllers/TVController");
const roleController = require("./controllers/roleController");
const accountController = require("./controllers/accountController");
const authController = require("./controllers/authController");
const authMiddleware = require("./middleware/authorisationMiddleware")

const {
    DynamoDBDocumentClient,
    PutCommand,
    DeleteCommand,
    ScanCommand,
    UpdateCommand,
    GetCommand,
} = require('@aws-sdk/lib-dynamodb');

const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
} = require('@aws-sdk/client-s3');


// Configure AWS clients
const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDBClient);
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

dotenv.config();

// Express App Setup
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://fsdp.vercel.app'], 
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// WebSocket Setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://fsdp.vercel.app'],
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  },
});


io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // Handle joining a TV room
  socket.on("join_tv_room", (tvID) => {
    socket.join(tvID);
    console.log(`User ${socket.id} joined TV room: ${tvID}`);
  });

  // Handle ad updates
  socket.on("ad_update", (data) => {
    const { tvID, ad } = data;
    // Broadcast the updated ad to all clients in the same room
    io.to(tvID).emit("ad_update", { ad });
    console.log(`Broadcasting ad update to room ${tvID}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

// Configure Multer for File Upload
const storage = multer.memoryStorage();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
      return cb(new Error('Only image and video files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 200 * 1024 * 1024 },
}).any(); // Use .any() to accept multiple files

// Upload and Save Ad
app.post('/api/upload', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { adTitle } = req.body;
      const adID = Date.now().toString();
      const mediaItems = [];

      // Process each file and its metadata
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const metadata = JSON.parse(req.body[`metadata_${i}`]);
        
        // Upload to S3
        const s3Key = `${adID}-${i}-${file.originalname}`;
        const s3Params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        await s3Client.send(new PutObjectCommand(s3Params));
        
        // Create media item entry
        mediaItems.push({
          id: metadata.id,
          type: metadata.type,
          url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`,
          metadata: {
            x: metadata.x,
            y: metadata.y,
            width: metadata.width,
            height: metadata.height
          }
        });
      }

      // Save advertisement details in DynamoDB
      const params = {
        TableName: process.env.DYNAMODB_TABLE_ADVERTISEMENTS,
        Item: {
          adID,
          adTitle,
          mediaItems,
          createdAt: new Date().toISOString()
        },
      };
      await ddbDocClient.send(new PutCommand(params));

      res.json({ message: 'Advertisement uploaded successfully', adID });
    } catch (error) {
      console.error('Error uploading advertisement:', error);
      res.status(500).json({ error: 'Failed to upload advertisement' });
    }
  });
});

// Retrieve Advertisements
app.get("/api/Advertisements", async (req, res) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_ADVERTISEMENTS,
    };
    const data = await dynamoDBClient.send(new ScanCommand(params));

    // For each advertisement, add the direct S3 image URL
    data.Items.forEach((item) => {
      item.FileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.adID}-${item.adTitle}`;
    });

    res.json(data.Items);
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// retrieve an advertisement by adID
app.get("/advertisements/:adID", async (req, res) => {
  try {
    const { adID } = req.params;

    const params = {
      TableName: process.env.DYNAMODB_TABLE_ADVERTISEMENTS,
      Key: {
        adID,
      },
    };

    const adData = await dynamoDBClient.send(new GetCommand(params));

    if (!adData.Item) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    // Return the advertisement data
    res.json(adData.Item);
  } catch (error) {
    console.error("Error fetching advertisement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete Advertisement
app.delete('/api/delete/:adID', async (req, res) => {
    const { adID } = req.params;
  
    try {
      // List objects in S3 with prefix
      const listParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Prefix: `${adID}-`, // Find files starting with "adID-"
      };
      const listResponse = await s3Client.send(new ListObjectsV2Command(listParams));
  
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        return res.status(404).json({ message: 'Ad not found in S3' });
      }
  
      // Extract the correct object key
      const s3Key = listResponse.Contents[0].Key;
  
      // Delete from S3
      const deleteParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
      };
      await s3Client.send(new DeleteObjectCommand(deleteParams));
  
      // Delete from DynamoDB
      const ddbParams = {
        TableName: process.env.DYNAMODB_TABLE_ADVERTISEMENTS,
        Key: { adID },
      };
      await ddbDocClient.send(new DeleteCommand(ddbParams));
  
      res.json({ message: 'Advertisement deleted successfully' });
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

// update coordinates
app.post("/api/update-coordinates", async (req, res) => {
  const { adID, coordinates } = req.body;

  if (!adID || !coordinates) {
    return res
      .status(400)
      .json({ error: "adID and coordinates are required." });
  }

    try {
        // get the current ad data
        const getParams = {
            TableName: process.env.DYNAMODB_TABLE_ADVERTISEMENTS,
            Key: { adID }
        };
        
        const currentAd = await ddbDocClient.send(new GetCommand(getParams));
        
        if (!currentAd.Item) {
            return res.status(404).json({ error: 'Advertisement not found' });
        }

        // Update the mediaItems array with new coordinates
        const updatedMediaItems = currentAd.Item.mediaItems.map(item => {
            if (coordinates[item.id]) {
                return {
                    ...item,
                    metadata: coordinates[item.id]
                };
            }
            return item;
        });

        // Update the item in DynamoDB
        const updateParams = {
            TableName: process.env.DYNAMODB_TABLE_ADVERTISEMENTS,
            Key: { adID },
            UpdateExpression: 'SET mediaItems = :mediaItems',
            ExpressionAttributeValues: {
                ':mediaItems': updatedMediaItems
            },
            ReturnValues: 'ALL_NEW'
        };

        const result = await ddbDocClient.send(new UpdateCommand(updateParams));
        res.json({ 
            message: 'Coordinates updated successfully', 
            updatedAd: result.Attributes 
        });
    } catch (error) {
        console.error('Error updating coordinates:', error);
        res.status(500).json({ error: 'Failed to update coordinates' });
    }
});

// update ad metadata 
app.post('/api/update-ad', (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { adID, adTitle, coordinates } = req.body;
      
      if (!adID) {
        return res.status(400).json({ error: "Missing adID, which is required to update an ad." });
      }

      const metadata = JSON.parse(coordinates);
      let mediaUrls = [];

      // Process uploaded files if any
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          // Handle image resizing if needed
          let processedBuffer = file.buffer;
          if (file.mimetype.startsWith('image/')) {
            processedBuffer = await sharp(file.buffer)
              .resize(metadata.width, metadata.height)
              .toBuffer();
          }

          // Upload to S3
          const s3Params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `ads/${adID}-${file.originalname}`,
            Body: processedBuffer,
            ContentType: file.mimetype,
          };
          await s3Client.send(new PutObjectCommand(s3Params));
          
          mediaUrls.push(`https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`);
        }
      }

      // Prepare update expression
      const expressionAttributeValues = {
        ':adTitle': adTitle,
        ':metadata': metadata,
      };

      let updateExpression = 'set adTitle = :adTitle, metadata = :metadata';

      if (mediaUrls.length > 0) {
        updateExpression += ', mediaUrls = :mediaUrls';
        expressionAttributeValues[':mediaUrls'] = mediaUrls;
      }

      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: { adID },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'UPDATED_NEW',
      };

      const response = await ddbDocClient.send(new UpdateCommand(params));
      res.json({ 
        message: 'Ad updated successfully', 
        updatedAttributes: response.Attributes,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
      });
    } catch (error) {
      console.error('Error updating ad:', error);
      res.status(500).json({ error: 'Failed to update ad' });
    }
  });
});

// Routes for tv groups
app.get("/api/tvgroups/:id", TVGroupController.getTVGroupsById);
app.get("/api/tvgroups", async (req, res) => {
  try {
    const params = {
      TableName: "TVGroups",
    };

    // Fetch data from DynamoDB
    const data = await dynamoDb.send(new ScanCommand(params));

    // Return the tvgroups as JSON
    res.json(data.Items);
  } catch (error) {
    console.error("Error fetching TV Groups:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/tvgroups", TVGroupController.addTVGroup);
app.put("/api/tvgroups/:groupID", TVGroupController.updateTVGroup);
app.delete("/api/tvgroups/:groupID", TVGroupController.deleteTVGroup);

// Routes for user authentication
export default async function handler(req, res) {
  if (req.method === 'POST') {
      await authController.login(req, res); // Call your login logic here
  } else {
      res.status(405).json({ message: 'Method Not Allowed' });
  }
}
app.post("/api/userLogin", authController.login);
app.post("/api/userSignUp", authController.signUp);

// Route for roles
app.get("/api/get-rolePermissions/:roleId", roleController.getPermissions);
app.post("/api/create-userRole", roleController.createRole);
app.get("/api/getAllRoles", roleController.getRoles);

// Route for Account
app.post("/api/edit-userRole/:uuid", authMiddleware.verifyJWT,accountController.editUserRole);
app.get("/api/get-userById/:uuid", accountController.getUserById);
app.get("/api/get-userByEmail", accountController.getUserByEmail);
app.get("/api/get-allUsers", authMiddleware.verifyJWT,accountController.getAllUsers);
app.delete("/api/delete-user/:uuid", accountController.deleteUser);

// Routes for TVs
app.get("/api/tvgroups/:groupID/tvs/:tvID", TVController.getTvById);
app.get("/api/tvgroups/:groupID/tvs", TVController.getAllTvsByTVGroup);
app.post("/api/tvgroups/:groupID/tvs", TVController.addTv);
app.delete("/api/tvgroups/:groupID/tvs/:tvID", TVController.deleteTv);
app.put("/api/tvgroups/:groupID/tvs/:tvID", TVController.updateAdForTv);
app.post("/api/tvgroups/:groupID/tvs/batch-delete", TVController.deleteTvs);
app.post("/api/tvgroups/:groupID/tvs/batch-update", TVController.updateBatchTvs);

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
