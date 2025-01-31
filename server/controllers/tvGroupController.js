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
    const {groupName} = req.body;
    const groupID = `grp${Math.floor(100000 + Math.random() * 900000)}`;
    const TVGroupData = {
      groupID,
      groupName
    }
    await TVGroup.addTVGroup(TVGroupData);

    res.status(201).json({ message: "Tv Group added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTVGroup = async (req, res) => {
  try {
    const { groupID } = req.params;
    const { newGroupName } = req.body;

    if (!groupID || !newGroupName) {
      return res.status(400).json({ message: "Group ID and new group name are required." });
    }

    const updatedGroup = await TVGroup.updateTVGroup(groupID, newGroupName); // Update the group
    if (updatedGroup) {
      res.status(200).json({ message: "TV Group updated successfully.", updatedGroup });
    } else {
      res.status(404).json({ message: "TV Group not found." });
    }
  } catch (error) {
    console.error("Error updating TV group:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
  updateTVGroup,
  deleteTVGroup,
};
