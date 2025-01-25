// controllers/tvGroupController.js
const dotenv = require("dotenv");
const TVGroup = require("../models/TVGroups");
dotenv.config();

const getAllTVGroups = async (req, res) => {
  try {
    const params = {
      TableName: "TVGroups",
    };

    const data = await dynamoDb.scan(params).promise();

    res.json(data.Items); // Ensure the data is returned properly
  } catch (error) {
    console.error("Error fetching TV groups:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getTVGroupsById = async (req, res) => {
  try {
    const group = await TVGroup.getTVGroupsById(req.params.id); // Call the renamed model function
    if (!group) {
      return res.status(404).json({ message: "TV Group not found" });
    }
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addTVGroup = async (req, res) => {
  try {
    await TVGroup.addTVGroup(req.body);
    res.status(201).json({ message: "Tv Group added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTVGroup = async (req, res) => {
  try {
    await TVGroup.deleteTVGroup(req.params.groupID);
    res.status(200).json({ message: "TV Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllTVGroups,
  getTVGroupsById,
  addTVGroup,
  deleteTVGroup,
};
