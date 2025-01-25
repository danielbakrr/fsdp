import React, { useState, useEffect } from "react";
import "../../../styles/advDisplay.css";
import Navbar from "../../navbar";
import { FaChevronRight, FaTrashAlt } from "react-icons/fa";
import AddTVGroupModal from "./addTVGroupModal";
import UpdateGroupModal from "./updateTVGroupModal";
import AddButton from "./addButton";
import { useNavigate } from "react-router-dom";

const AdvertisementDisplay = () => {
  const [tvgroups, setTVGroups] = useState([]); // Store Groups
  const [tvs, setTvs] = useState([]); // Store TVs for selected TVGroup
  const [selectedTVGroup, setSelectedTVGroup] = useState(null); // Store selected TVGroup
  const [selectedTv, setSelectedTv] = useState(null); // Store selected TV
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state for selecting ad
  const [ads, setAds] = useState([]); // Store ads
  const [tvGroupAdded, setTVGroupAdded] = useState(false); // Track if TVGroup is added
  const [tvGroupError, setTVGroupError] = useState(false); // Track if there was an error
  const [notifications, setNotifications] = useState([]); // Store notifications
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedUpdateGroup, setSelectedUpdateGroup] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTVGroups();
    const intervalId = setInterval(() => {
      fetchTVGroups();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Fetch the list of Groups
  const fetchTVGroups = async () => {
    try {
      const response = await fetch("/tvgroups");
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error); // Handle the error returned by the API
      }

      console.log("Groups data:", data);
      setTVGroups(data); // Set Groups state
    } catch (error) {
      console.error("Error fetching TV groups:", error);
    }
  };

  // Fetch TVs for the selected TVGroup
  const fetchTvs = async (groupID) => {
    try {
      const response = await fetch(`/tvgroups/${groupID}/tvs`); // Endpoint to get TVs for a TVGroup
      const data = await response.json();
      setTvs(data); // Set the TVs for the selected TVGroup
    } catch (error) {
      console.error("Error fetching TVs:", error);
    }
  };

  // Handle tv group selection
  const handleTVGroupSelect = (group) => {
    navigate(`/advertisement-display/tvgroups/${group.groupID}`, {
      state: { group },
    });
    setSelectedTVGroup(group); // Set the selected tv group
    setTvs([]); // Clear the TVs list before fetching new TVs
    fetchTvs(group.groupID); // Fetch TVs for the selected group
  };

  // Handle TV selection
  const handleTvSelect = (tv) => {
    setSelectedTv(tv); // Set the selected TV
    setIsModalOpen(true); // Open the modal to select an ad
  };

  // Add new TVGroup after modal submission
  const handleAddTVGroup = (newTVGroup) => {
    try {
      setTVGroups((prevTVGroups) => [...prevTVGroups, newTVGroup]);

      // Set success message
      setTVGroupAdded(true);
      setTVGroupError(false);
      fetchTVGroups(); // Fetch groups again to update the list

      // Trigger success notification
      createNotification("success", "fa-solid fa-circle-check", "Success");
    } catch (error) {
      // If there's an error, set error message
      setTVGroupAdded(false);
      setTVGroupError(true);

      // Trigger error notification
      createNotification("error", "fa-solid fa-circle-exclamation", "Error");
    }
  };

  // Function to create notifications
  const createNotification = (type, icon, title) => {
    const newNotification = { type, icon, title };
    setNotifications((prevNotifications) => [
      ...prevNotifications,
      newNotification,
    ]);

    // Automatically remove the notification after 5 seconds
    setTimeout(() => {
      setNotifications((prevNotifications) =>
        prevNotifications.filter(
          (notification) => notification !== newNotification
        )
      );
    }, 5000);
  };

  // Handle delete TVGroup
  const handleDeleteTVGroup = async (groupID) => {
    try {
      // Make API call to delete the TVGroup (assuming DELETE endpoint exists)
      await fetch(`/tvgroups/${groupID}`, { method: "DELETE" });

      // Remove deleted group from the state
      setTVGroups(tvgroups.filter((group) => group.groupID !== groupID));

      // Trigger success notification
      createNotification(
        "success",
        "fa-solid fa-circle-check",
        "TV Group deleted successfully"
      );
    } catch (error) {
      console.error("Error deleting TV group:", error);
      createNotification(
        "error",
        "fa-solid fa-circle-exclamation",
        "Error deleting TV group"
      );
    }
  };

  // Handle update TVGroup
  const handleUpdateTVGroup = (group) => {
    setSelectedUpdateGroup(group);
    setIsUpdateModalOpen(true);
  };

  return (
    <div className="Ad">
      <Navbar />
      {/* TVGroups Header and Add Button */}
      <div className="tvgroup-header">
        <h3>TV Groups:</h3>
        <AddButton onClick={() => setIsModalOpen(true)} label="Add" />
      </div>

      {/* TVGroups Table */}
      <table className="tvgroup-table">
        <thead>
          <tr>
            <th>Group Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tvgroups.length > 0 ? (
            tvgroups.map((tvgroup) => (
              <tr key={tvgroup.groupID}>
                <td>{tvgroup.groupName}</td>
                <td>
                  <button onClick={() => handleTVGroupSelect(tvgroup)}>
                    View TVs
                  </button>
                  <button onClick={() => handleUpdateTVGroup(tvgroup)}>
                    Update
                  </button>
                  <button onClick={() => handleDeleteTVGroup(tvgroup.groupID)}>
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2">No TV groups available</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* TVs List for Selected Groups */}
      {selectedTVGroup && (
        <div>
          <h3>TVs in {selectedTVGroup.groupName}:</h3>
          <table className="tv-table">
            <thead>
              <tr>
                <th>TV Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tvs.length > 0 ? (
                tvs.map((tv) => (
                  <tr key={tv.id}>
                    <td>{tv.name}</td>
                    <td>
                      <button
                        onClick={() => handleTvSelect(tv)}
                        className="btn-select-ad"
                      >
                        Select Ad
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2">No TVs available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Adding New TVGroup */}
      <AddTVGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTVGroup={handleAddTVGroup}
      />

      {/* Modal for Updating TVGroup */}
      <UpdateGroupModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        groupID={selectedUpdateGroup?.groupID} 
        onUpdateGroup={handleUpdateTVGroup} 
      />
    </div>
  );
};

export default AdvertisementDisplay;
