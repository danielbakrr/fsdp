require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const { Server } = require('socket.io');
const http = require('http');
const bodyParser = require('body-parser');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const {
    DynamoDBDocumentClient,
    PutCommand,
    DeleteCommand,
    ScanCommand,
    UpdateCommand,
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

// Express App Setup
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', methods: ['GET', 'POST', 'DELETE'], credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// WebSocket Setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'DELETE'],
    },
});

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('join_tv', (tvID) => {
        socket.join(tvID);
        console.log(`User ${socket.id} joined TV room: ${tvID}`);
    });

    socket.on('send_message', (data) => {
        const { tv, message } = data;
        console.log(`Sending message to TV room: ${tv}`);
        io.to(tv).emit('receive_message', { message, tv });
    });
});

// Configure Multer for File Upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
          return cb(new Error('Only image and video files are allowed!'), false);
      }
      cb(null, true);
  },
  limits: { fileSize: 200 * 1024 * 1024 }, // Increased to 50MB for videos
});

// Upload and Save Ad
app.post('/api/upload', upload.single('media'), async (req, res) => {
  try {
      const { adTitle, coordinates } = req.body;
      const metadata = JSON.parse(coordinates);
      const adID = Date.now().toString();
      const isVideo = req.file.mimetype.startsWith('video/');

      // Upload media to S3
      const s3Params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `${adID}-${req.file.originalname}`,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
      };
      await s3Client.send(new PutObjectCommand(s3Params));
      const mediaUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;

      // Save advertisement details in DynamoDB
      const params = {
          TableName: process.env.DYNAMODB_TABLE_ADVERTISEMENTS,
          Item: {
              adID,
              adTitle,
              mediaUrl,
              mediaType: isVideo ? 'video' : 'image',
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
app.get('/api/Advertisements', async (req, res) => {
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
        console.error('Error fetching advertisements:', error);
        res.status(500).json({ message: 'Internal server error' });
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
  
      res.json({ message: 'Advertisement deleted successfully' });
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // update coordinates
  app.post('/api/update-coordinates', async (req, res) => {
    const { adID, coordinates } = req.body;

    if (!adID || !coordinates) {
        return res.status(400).json({ error: 'adID and coordinates are required.' });
    }

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_ADVERTISEMENTS,
            Key: { adID },
            UpdateExpression: 'set metadata = :coordinates',
            ExpressionAttributeValues: {
                ':coordinates': coordinates,
            },
            ReturnValues: 'UPDATED_NEW',
        };

        const result = await ddbDocClient.send(new UpdateCommand(params));
        res.json({ message: 'Coordinates updated successfully', updatedAttributes: result.Attributes });
    } catch (error) {
        console.error('Error updating coordinates:', error);
        res.status(500).json({ error: 'Failed to update coordinates' });
    }
});

// update ad metadata 
app.post('/api/update-ad', upload.single('image'), async (req, res) => {
    const { adID, adTitle, coordinates } = req.body;
    let imageUrl = null;

    try {
        if (!adID) {
            return res.status(400).json({ error: "Missing adID, which is required to update an ad." });
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
            ':adTitle': adTitle,
            ':metadata': metadata,
        };

        let updateExpression = 'set adTitle = :adTitle, metadata = :metadata';

        if (imageUrl) {
            updateExpression += ', imageUrl = :imageUrl';
            expressionAttributeValues[':imageUrl'] = imageUrl;
        }

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: { adID },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'UPDATED_NEW',
        };

        const response = await ddbDocClient.send(new UpdateCommand(params));
        res.json({ message: 'Ad updated successfully', updatedAttributes: response.Attributes });
    } catch (error) {
        console.error('Error updating ad:', error);
        res.status(500).json({ error: 'Failed to update ad' });
    }
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
