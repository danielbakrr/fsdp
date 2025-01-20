const express = require("express");
const advertisementController = require("./controllers/AdvertisementController");
const cors = require("cors");
const authController = require("./controllers/authController")
const { dynamoDb } = require("./awsConfig");
const roleController = require("./controllers/roleController")
const accountController = require("./controllers/accountController")
// const ws = require("ws");

// const WebSocketClient = require("./WebsocketClient");
const { Server } = require("socket.io");
const http = require("http");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const {
  ScanCommand,
  PutCommand,
  DeleteCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const { v4: uuidv4 } = require("uuid");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log("PORT", PORT);
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://3000--main--devfsdp--manoman--gmm37v7g4l358.pit-1.try.coder.app"],
    methods: ["GET", "POST"],
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

app.use(express.json({ limit: "10mb" }));

// Helper function to generate pre-signed URL
app.post("/api/generate-presigned-url", async (req, res) => {
  const { FileName, FileType } = req.body;
  const FileId = uuidv4(); // Generate a unique identifier (FileId)
  console.log("FileId", FileId);
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: FileId,
    ContentType: FileType,
  });
  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log("url", url);
    res.setHeader("Content-Type", "application/json");
    res.json({ url, key: FileId, FileId });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ error: error.message });
  }
});

// Retrieve files from DynamoDB and generate pre-signed URLs for each item
app.get("/api/files", async (req, res) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_FILES,
    };
    const data = await dynamoDb.send(new ScanCommand(params));
    for (const item of data.Items) {
      const getObjectParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: item.FileId,
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      item.FileUrl = url;
    }
    console.log("Metadata", data.$metadata);
    res.setHeader("Content-Type", "application/json");
    res.json(data.Items);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get('/api/getfiles/:fileID', async (req,res) => {
  try{
    const fileID = req.params.fileID;
    console.log("fileID", fileID);
    const params = {
      TableName: process.env.DYNAMODB_TABLE_FILES,
      Key:{
        "FileId" : fileID
      }
    };

    const data = await dynamoDb.send(new GetCommand(params));
    console.log("data", data);
    const metadata = data.$metadata.httpStatusCode;
    switch (metadata){
      case 200:
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(data.Item);
        break;
      case 404:
        res.status(404).json({message: "File not found"});
      case 400:
        res.status(400).json({message: "Bad Request"});
      default:
        res.status(500).json({message: "Internal Server Error"});
        break;
    }
    
  }
  catch (err){
    console.error("Error fetching file:", err);
    res.status(500).json({message: "Internal Server Error"});
  }
})

// Upload advertisement metadata to DynamoDB
app.put("/create/advertisements", async (req, res) => {
  const { templateId, Status, templateType, TemplateUrl } = req.body;
  try {
    const params = {
      TableName: AdTemplates,
      Item: {
        templateId,
        CreatedDate: new Date.toISOString(),
        Status,
        templateType,
        TemplateUrl,
      },
    };
    const command = new PutObjectCommand(params);
    await dynamoDb.send(command);
    console.log(`Template with ID ${templateId} added successfully`);
    res.status(200).send("Template uploaded successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Upload file metadata to DynamoDB and S3
app.post("/api/upload-file", async (req, res) => {
  const { FileId, FileName, FileSize, FileType, FileUrl } = req.body;
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_FILES,
      Item: {
        FileId,
        FileName,
        FileSize,
        FileType,
        FileUrl,
        UploadDate: new Date().toISOString(),
      },
    };
    const command = new PutCommand(params);
    await dynamoDb.send(command);
    console.log(`File ${FileName} metadata saved to DynamoDB`);
    res.status(200).json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Error uploading file metadata to DynamoDB:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete file from S3 and DynamoDB
app.delete("/api/delete-file/:fileKey", async (req, res) => {
  const { fileKey } = req.params;
  try {
    const deleteParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
    };
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log(`File ${fileKey} deleted from S3`);

    const deleteDynamoParams = {
      TableName: process.env.DYNAMODB_TABLE_FILES,
      Key: { FileId: fileKey },
    };
    await dynamoDb.send(new DeleteCommand(deleteDynamoParams));
    console.log(`File ${fileKey} deleted from DynamoDB`);

    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file from S3 and DynamoDB:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Routes for advertisements
app.post("/createAds", advertisementController.createAd);
app.get('/getAdID:/FileId',advertisementController.retrieveAdID)
app.put("/addTvs", advertisementController.addTv);
app.get("/getAds", advertisementController.retrieveAllAdvertisements);
app.post("/pushAdsToTv/:adID", advertisementController.pushTvAdvertisement);
app.delete("/deleteAd/:adID", advertisementController.deleteAd);

// WebSocketClient.setupWebSocketServer(server);

// to handle file upload

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads")); // Save files in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with timestamp
  },
});

const upload = multer({ storage });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
app.post('/userLogin',authController.login);
app.post('/userSignUp',authController.signUp);


app.get('/get-rolePermissions/:roleId',roleController.getPermissions);
app.post('/create-userRole',roleController.createRole);

// Route for Account 
app.post('/api/edit-userRole/:uuid',accountController.editUserRole);
app.get('/api/get-userById/:uuid',accountController.getUserById);
app.get('/api/get-userByEmail',accountController.getUserByEmail);
app.get('/api/get-allUsers',accountController.getAllUsers);



server.listen(PORT, () => {
  console.log(`WebSocket Server running on port ${PORT}`);
})




console.log("Socket.io server listening on port 5000");
