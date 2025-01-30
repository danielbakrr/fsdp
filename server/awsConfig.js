const { S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const {DynamoDBStreamsClient} = require('@aws-sdk/client-dynamodb-streams')
const dotenv = require('dotenv');
dotenv.config();

// initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dbStreams = new DynamoDBStreamsClient({
  region: process.env.AWS_REGION,
});

// initialize DynamoDB Client
const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, 
  },
});

const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient);

module.exports = { dynamoDb, s3, dbStreams};