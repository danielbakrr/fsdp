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

const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  //DeleteCommand,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

const {
  S3Client,
  PutObjectCommand,
  //DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Upload and Save Ad
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    const { FileName, coordinates } = req.body;
    const metadata = JSON.parse(coordinates); // Parse coordinates with size
    const FileId = Date.now().toString();

    // Get file size and type
    const FileSize = req.file.size; // File size in bytes
    const FileType = req.file.mimetype; // MIME type of the file

    // Upload image to S3
    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${FileId}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };
    await s3Client.send(new PutObjectCommand(s3Params));
    const FileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;

    // Save metadata in DynamoDB
    const params = {
      TableName: process.env.DYNAMODB_TABLE_FILES,
      Item: {
        FileId,
        FileName,
        FileSize,
        FileType,
        FileUrl,
        metadata,
        UploadDate: new Date().toISOString(),
      },
    };
    await ddbDocClient.send(new PutCommand(params));

    res.json({ message: "Ad uploaded successfully", FileId });
  } catch (error) {
    console.error("Error uploading ad:", error);
    res.status(500).json({ error: "Failed to upload ad" });
  }
});

// Update Ad Coordinates
app.post("/api/update-coordinates", async (req, res) => {
  const { FileId, coordinates } = req.body;

  if (!FileId || !coordinates) {
    return res
      .status(400)
      .json({ error: "FileId and coordinates are required." });
  }

  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_FILES,
      Key: { FileId },
      UpdateExpression: "set metadata = :coordinates",
      ExpressionAttributeValues: {
        ":coordinates": JSON.parse(coordinates),
      },
      ReturnValues: "UPDATED_NEW",
    };

    const result = await dynamoDBClient.send(new UpdateCommand(params));
    res.json({ message: "Coordinates updated successfully", result });
  } catch (error) {
    console.error("Error updating coordinates:", error);
    res.status(500).json({ error: "Failed to update coordinates" });
  }
});

// Update Ad Metadata
app.post("/api/update-ad", upload.single("image"), async (req, res) => {
  const { FileId, FileName, coordinates } = req.body;
  let FileUrl = null;

  try {
    if (!FileId) {
      return res
        .status(400)
        .json({ error: "Missing FileId, which is required to update an ad." });
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
        Key: `${FileId}-${req.file.originalname}`,
        Body: resizedImageBuffer,
        ContentType: req.file.mimetype,
      };
      await s3Client.send(new PutObjectCommand(s3Params));
      FileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
    }

    const expressionAttributeValues = {
      ":FileName": FileName,
      ":metadata": metadata,
    };

    let updateExpression = "set FileName = :FileName, metadata = :metadata";

    if (FileUrl) {
      updateExpression += ", FileUrl = :FileUrl";
      expressionAttributeValues[":FileUrl"] = FileUrl;
    }

    const params = {
      TableName: process.env.DYNAMODB_TABLE_FILES,
      Key: { FileId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "UPDATED_NEW",
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

// Routes for TVs
app.get("/tvgroups/:groupID/tvs/:tvID", TVController.getTvById);
app.get("/tvgroups/:groupID/tvs", TVController.getAllTvsByTVGroup);
app.post("/tvgroups/:groupID/tvs", TVController.addTv);
app.delete("/tvgroups/:groupID/tvs/:tvID", TVController.deleteTv);
app.put("/tvgroups/:groupID/tvs/:tvID", TVController.updateAdForTv);
app.post("/tvgroups/:groupID/tvs/batch-delete", TVController.deleteTvs);

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
