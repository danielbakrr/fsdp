const Advertisement = require('../models/Advertisement');
// const retrieveStream = require('../getStreamArn');
const {sendUsersConnected} = require('../WebsocketClient')
const {s3} = require('../awsConfig');
const dotenv = require('dotenv');
dotenv.config();
const {GetObjectCommand} = require('@aws-sdk/client-s3');
const uuidv4 = require('uuid').v4;
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const retrieveAllAdvertisements = async (req, res) => {
    try {
        const advertisements = await Advertisement.retireveAllAds();
        for(const item of advertisements.Items){
        // create a get
        const getObjectParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: item.FileId,
        };
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3,command,{expiresIn: 3600});
        // Dynamically generate the signed url and assign to the File.url property
        item.FileUrl = url; 
      }
      console.log("Metadata",advertisements.$metadata);
      res.setHeader('Content-Type', 'application/json'); // Ensure JSON header
      const fileData = advertisements.Items.map(item => ({
        adID: item.adID,
        FiletType: item.adContent.FileType,
        FileSize: item.adContent.FileSize,
        FileUrl: item.FileUrl,
        UploadDate: item.uploadDate,
        FileId: item.FileId,
        FileName: item.adContent.FileName,
        assignedTvs: item.assignedTvs,
      }));


      console.log(fileData);
      res.json(fileData);
    } 
    catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: 'Internal server error'});
    }
}

const pushTvAdvertisement = async (req, res) => {
    try {
        const adID = req.params.adID;
        const adRecord = await Advertisement.retireveAd(adID);

        console.log(adRecord.assignedTvs);
        // Now i send to connected clients in websocket;
        sendUsersConnected(adRecord.assignedTvs,adRecord);
        

        if(!adRecord == null){
            return res.status(404).send("Ad not found");
        }
        else {
            return res.status(200).send(adRecord);
        }

    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
};

const deleteAd = async (req, res) => {
    try {
        const adID = req.params.adID;
        console.log(adID);
        const adRecord = await Advertisement.retireveAd(adID);
        if(adRecord.assignedTvs.length > 0){
            return res.status(400).send("Ad has tvs assigned to it");
        }
        const deleteAd = await Advertisement.deleteAd(adID);
        if (deleteAd.$metadata.httpStatusCode !== 200) {
            return res.status(404).send("AdID specified does not exist");
        }
        return res.status(200).json({ "message": "Successfully deleted ad", updatedAttributes: deleteAd.Attributes });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
};

const createAd = async (req, res) => {
    try {
        const adID = uuidv4(); // Generate a unique identifier for ads 
        const {adTitle, adContent, adType, uploadDate, assignedTvs, FileId } = req.body;
        const advertisement = new Advertisement(adID,adTitle, adContent, adType, uploadDate, assignedTvs,FileId);
        console.log(advertisement);
        const createdAd = await Advertisement.createAd(advertisement);
        if (createdAd == null) {
            return res.status(404).send("AdID specified already exists");
        }
        return res.status(200).json({ "message": "Successfully created ad", updatedAttributes: advertisement.Attributes });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
};

const addTv = async (req, res) => {
    try {
        const { tvIDList, adID } = req.body;

        // Check if tviDList and adID are provided
        if (!tvIDList || !adID) {
            return res.status(400).send("tvIDList and adID are required");
        }

        // Promise.all basically creates an array of promises and then you will process them in paralle (synchronus)
        const results = await Promise.all(tvIDList.map(async (tv) => {
            const tvID = tv;
            const addTvToAds = await Advertisement.addTv(tvID, adID);
            if (addTvToAds.$metadata.httpStatusCode !== 200) {
                throw new Error("AdID and tvID specified do not exist");
            }
            return addTvToAds.Attributes;
        }));

        return res.status(200).json({
            message: "Successfully added tvIDs to the advertisement table",
            updatedAttributes: results
        });

    } catch (err) {
        console.error(err);
        if (err.message === "AdID and tvID specified do not exist") {
            return res.status(404).send(err.message);
        }
        return res.status(500).send("Internal Server Error");
    }
};

const retrieveAdID = async (req,res) => {
    try {
        const fileID = req.params.FileId
        console.log(fileID);
        const adId = await Advertisement.retrieveAdByAdID(fileID);
        const metadata = adId.$metadata.httpStatusCode;
        switch (metadata) {
            case 200:
                return res.status(200).send(adId.Items);
                break;
            case 404:
                return res.status(404).send("Ad not found");
            default:
                return res.status(500).send("Internal Server Error");
        }
    }
    catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
}


module.exports = {
    retrieveAllAdvertisements,
    pushTvAdvertisement,
    deleteAd,
    createAd,
    addTv,
    retrieveAdID,
};
