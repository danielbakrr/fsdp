require("dotenv").config();
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

const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

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

// Express App Setup
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// WebSocket Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "DELETE"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_tv", (tvID) => {
    socket.join(tvID);
    console.log(`User ${socket.id} joined TV room: ${tvID}`);
  });

  socket.on("send_message", (data) => {
    const { tv, message } = data;
    console.log(`Sending message to TV room: ${tv}`);
    io.to(tv).emit("receive_message", { message, tv });
  });
});

// Configure Multer for File Upload
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Upload and Save Ad
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
      const { adTitle, coordinates } = req.body;
      const metadata = JSON.parse(coordinates);
      const adID = Date.now().toString();
  
      // Upload image to S3
      const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${adID}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      await s3Client.send(new PutObjectCommand(s3Params));
      const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
  
      // Save advertisement details in DynamoDB
      const params = {
        TableName: process.env.DYNAMODB_TABLE_ADVERTISEMENTS,
        Item: {
          adID,
          adTitle,
          imageUrl,
          metadata,
        },
      };
      await ddbDocClient.send(new PutCommand(params));
  
      res.json({ message: 'Advertisement uploaded successfully', adID });
    } catch (error) {
      console.error('Error uploading advertisement:', error);
      res.status(500).json({ error: 'Failed to upload advertisement' });
    }
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

// Delete Advertisement
app.delete("/api/delete/:adID", async (req, res) => {
  const { adID } = req.params;

  try {
    // List objects in S3 with prefix
    const listParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: `${adID}-`, // Find files starting with "adID-"
    };
    const listResponse = await s3Client.send(
      new ListObjectsV2Command(listParams)
    );

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return res.status(404).json({ message: "Ad not found in S3" });
    }

    // Extract the correct object key
    const s3Key = listResponse.Contents[0].Key; // Assuming there's only one matching file

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

    res.json({ message: "Advertisement deleted successfully" });
  } catch (error) {
    console.error("Error deleting advertisement:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

  // update coordinates
  app.post('/api/update-coordinates', async (req, res) => {
    const { adID, coordinates } = req.body;

  if (!adID || !coordinates) {
    return res
      .status(400)
      .json({ error: "adID and coordinates are required." });
  }

  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_ADVERTISEMENTS,
      Key: { adID },
      UpdateExpression: "set metadata = :coordinates",
      ExpressionAttributeValues: {
        ":coordinates": coordinates,
      },
      ReturnValues: "UPDATED_NEW",
    };

    const result = await ddbDocClient.send(new UpdateCommand(params));
    res.json({
      message: "Coordinates updated successfully",
      updatedAttributes: result.Attributes,
    });
  } catch (error) {
    console.error("Error updating coordinates:", error);
    res.status(500).json({ error: "Failed to update coordinates" });
  }
});

// update ad metadata
app.post("/api/update-ad", upload.single("image"), async (req, res) => {
  const { adID, adTitle, coordinates } = req.body;
  let imageUrl = null;

  try {
    if (!adID) {
      return res
        .status(400)
        .json({ error: "Missing adID, which is required to update an ad." });
    }

    const metadata = JSON.parse(coordinates);

    if (req.file) {
      // Resize the image based on metadata
      const resizedImageBuffer = await sharp(req.file.buffer)
        .resize(metadata.width, metadata.height) // Resize to provided dimensions
        .toBuffer();

      // Upload resized image to S3
      const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `ads/${adID}-${req.file.originalname}`,
        Body: resizedImageBuffer,
        ContentType: req.file.mimetype,
      };
      await s3Client.send(new PutObjectCommand(s3Params));
      imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
    }

    const expressionAttributeValues = {
      ":adTitle": adTitle,
      ":metadata": metadata,
    };

    let updateExpression = "set adTitle = :adTitle, metadata = :metadata";

    if (imageUrl) {
      updateExpression += ", imageUrl = :imageUrl";
      expressionAttributeValues[":imageUrl"] = imageUrl;
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
      message: "Ad updated successfully",
      updatedAttributes: response.Attributes,
    });
  } catch (error) {
    console.error("Error updating ad:", error);
    res.status(500).json({ error: "Failed to update ad" });
  }
});

// Retrieve Files with Signed URLs
app.get("/api/files", async (req, res) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_FILES,
    };
    const data = await dynamoDBClient.send(new ScanCommand(params));
    for (const item of data.Items) {
      const getObjectParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: item.FileId,
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      item.FileUrl = url;
    }
    res.json(data.Items);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Advertisement route
// Route to get an advertisement by adID
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

app.get("/advertisements", async (req, res) => {
  try {
    // Query DynamoDB to get all advertisements
    const params = {
      TableName: process.env.DYNAMODB_TABLE_ADVERTISEMENTS,
    };

    const adData = await dynamoDBClient.send(new ScanCommand(params)); // Use ScanCommand to retrieve all items

    if (!adData.Items || adData.Items.length === 0) {
      return res.status(404).json({ message: "No advertisements found" });
    }

    // Return all advertisements
    res.json(adData.Items);
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete File
/*app.delete('/api/delete-file/:fileKey', async (req, res) => {
    const { fileKey } = req.params;
    try {
        // Delete from S3
        const deleteParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileKey,
        };
        await s3Client.send(new DeleteObjectCommand(deleteParams));

        // Delete from DynamoDB
        const deleteDynamoParams = {
            TableName: process.env.DYNAMODB_TABLE_FILES,
            Key: { FileId: fileKey },
        };
        await dynamoDBClient.send(new DeleteCommand(deleteDynamoParams));

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});*/

// Routes for tv groups
app.get("/tvgroups/:id", TVGroupController.getTVGroupsById);
app.get("/tvgroups", async (req, res) => {
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

app.post("/tvgroups", TVGroupController.addTVGroup);
app.put("/tvgroups/:groupID", TVGroupController.updateTVGroup);
app.delete("/tvgroups/:groupID", TVGroupController.deleteTVGroup);

app.post("/api/upload-file", upload.single("file"), (req, res) => {
  const { tv } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const fileUrl = `http://localhost:${PORT}/uploads/${file.filename}`;
  // need get the presigned url
  

  io.to(tv).emit("receive_message", { message: fileUrl, tv });

  res.status(200).json({ fileUrl });
});


// Routes for user authentication 
app.post('/api/userLogin',authController.login);
app.post('/api/userSignUp',authController.signUp);

// Route for roles 

app.get('/api/get-rolePermissions/:roleId',roleController.getPermissions);
app.post('/api/create-userRole',roleController.createRole);
app.get('/api/getAllRoles',roleController.getRoles);


// Route for Account 
app.post('/api/edit-userRole/:uuid',accountController.editUserRole);
app.get('/api/get-userById/:uuid',accountController.getUserById);
app.get('/api/get-userByEmail',accountController.getUserByEmail);
app.get('/api/get-allUsers',accountController.getAllUsers);
app.delete('/api/delete-user/:uuid',accountController.deleteUser);





// Routes for TVs
app.get("/tvgroups/:groupID/tvs/:tvID", TVController.getTvById);
app.get("/tvgroups/:groupID/tvs", TVController.getAllTvsByTVGroup);
app.post("/tvgroups/:groupID/tvs", TVController.addTv);
app.delete("/tvgroups/:groupID/tvs/:tvID", TVController.deleteTv);
app.put("/tvgroups/:groupID/tvs/:tvID", TVController.updateAdForTv);
app.post("/tvgroups/:groupID/tvs/batch-delete", TVController.deleteTvs);
app.post("/tvgroups/:groupID/tvs/batch-update", TVController.updateBatchTvs);

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
