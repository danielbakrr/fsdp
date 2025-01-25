import React, { useState, useEffect } from "react";
import "../../../styles/advDisplay.css";
import Navbar from "../../navbar";
import { FaChevronRight } from "react-icons/fa";
import AddTVGroupModal from "./addTVGroupModal";
import "../../../styles/advDisplay.css";
import AddButton from "./addButton";
import { useNavigate } from "react-router-dom";

const AdvertisementDisplay = () => {
  const [tvgroups, setTVGroups] = useState([]); // Store Groups
  const [tvs, setTvs] = useState([]); // Store TVs for selected TVGroup
  const [selectedTVGroup, setSelectedTVGroup] = useState(null); // Store selected TVGroup
  const [selectedTv, setSelectedTv] = useState(null); // Store selected TV
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state for selecting ad
  const [ads, setAds] = useState([]); // Store ads
  const [displayedAd, setDisplayedAd] = useState(null); // Store the ad to display
  const [tvGroupAdded, setTVGroupAdded] = useState(false); // Track if TVGroup is added
  const [tvGroupError, setTVGroupError] = useState(false); // Track if there was an error
  const [notifications, setNotifications] = useState([]); // Store notifications
  const navigate = useNavigate();

  useEffect(() => {
    fetchTVGroups(); // Fetch Groups when the component mounts
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
    navigate(`/advertisement-display/tvgroups/${group.groupID}`,{ state: { group } });
    setSelectedTVGroup(group); // Set the selected tv group
    setTvs([]); // Clear the TVs list before fetching new TVs
    fetchTvs(group.groupID); // Fetch TVs for the selected group
  };

  // Handle TV selection
  const handleTvSelect = (tv) => {
    setSelectedTv(tv); // Set the selected TV
    setIsModalOpen(true); // Open the modal to select an ad
  };

  // Handle ad selection
  const handleAdSelection = (ad) => {
    setDisplayedAd(ad.FileUrl); // Set the ad to display
    setIsModalOpen(false); // Close the modal
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

  return (
    <div className="Ad">
      <Navbar />
      <h1>TV Groups</h1>

      {/* New TVGroup Button */}
      <div className="new-tvgroup-container">
        <AddButton onClick={() => setIsModalOpen(true)} label="Add" />
      </div>

      {/* TVGroups List */}
      <h3>TV Groups:</h3>
      <div className="tvgroups-list">
        {tvgroups.length > 0 ? (
          tvgroups.map((tvgroup) => (
            <div
              key={tvgroup.groupID} // Use groupID as the key
              className="tvgroup-card"
              onClick={() => handleTVGroupSelect(tvgroup)}
            >
              <div className="tvgroup-info">
                <p>{tvgroup.groupName}</p>{" "}
              </div>
              <FaChevronRight className="tvgroup-arrow" />
            </div>
          ))
        ) : (
          <p>No TV groups available</p> // Fallback if tvgroups array is empty
        )}
      </div>

      {/* TVs List for Selected Groups */}
      {selectedTVGroup && (
        <div>
          <h3>TVs in {selectedTVGroup.groupName}:</h3>
          <div className="tvs-list">
            {tvs.map((tv) => (
              <div
                key={tv.id}
                className="tv-card"
                onClick={() => handleTvSelect(tv)}
              >
                <p>{tv.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display Selected Ad */}
      {displayedAd && (
        <div className="displayed-ad-container">
          {displayedAd.startsWith("http") ? (
            <img
              src={displayedAd}
              alt="Displayed Ad"
              className="displayed-ad"
            />
          ) : (
            <p>Unsupported file type</p>
          )}
        </div>
      )}

      {/* Modal for Adding New TVGroup */}
      <AddTVGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTVGroup={handleAddTVGroup}
      />
    </div>
  );
};

export default AdvertisementDisplay;
