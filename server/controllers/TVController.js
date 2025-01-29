// controllers/tvs.js
const TVs = require("../models/TVs");
const dotenv = require("dotenv");
dotenv.config();

const getAllTvsByTVGroup = async (req, res) => {
  try {
    const groupID = req.params.groupID;
    const tvs = await TVs.getAllTvs(groupID);

    if (!tvs || tvs.length === 0) {
      return res.status(404).json({ message: "No TVs found for this group" });
    }

    res.status(200).json(tvs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTvById = async (req, res) => {
  try {
    const groupID = req.params.groupID;
    const tvID = req.params.tvID;
    const tv = await TVs.getTvById(groupID, tvID);
    if (!tv) {
      return res.status(404).json({ message: "TV not found" });
    }
    res.status(200).json(tv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addTv = async (req, res) => {
  try {
    const { groupID } = req.body;

    if (!groupID) {
      return res.status(400).json({ error: "groupID is required" });
    }

    const tvID = `tv${Math.floor(100000 + Math.random() * 900000)}`;
    const tvData = {
      groupID,
      tvID,
      adID: null,
    };

    await TVs.addTv(tvData);
    res.status(201).json({ message: "TV added successfully", tvData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTv = async (req, res) => {
  const { groupID, tvID } = req.params;

  // Log the parameters for debugging
  console.log("Received groupID:", groupID);
  console.log("Received tvID:", tvID);

  if (!groupID || !tvID) {
    return res
      .status(400)
      .json({ error: "Both groupID and tvID are required to delete a TV." });
  }

  try {
    await TVs.deleteTv(groupID, tvID);
    res.status(200).json({ message: "TV deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateAdForTv = async (req, res) => {
  const { groupID, tvID } = req.params;
  const { adID } = req.body;

  if (!adID) {
    return res.status(400).json({ error: "adID is required" });
  }

  try {
    const updatedTv = await TVs.updateAdForTv(groupID, tvID, adID);
    res.status(200).json({ message: updatedTv.message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTvs = async (req, res) => {
  const { groupID } = req.params;
  const { tvIds } = req.body;

  if (!Array.isArray(tvIds) || tvIds.length === 0) {
    return res.status(400).json({ error: "No TV IDs provided for deletion" });
  }

  try {
    await TVs.deleteTvs(groupID, tvIds);
    res.status(200).json({ message: "TVs deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllTvsByTVGroup,
  getTvById,
  addTv,
  deleteTv,
  updateAdForTv,
  deleteTvs,
};
