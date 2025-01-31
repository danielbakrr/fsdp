import React, { useEffect, useState, useCallback } from "react";
import "./selectAdModal.css";
import AlertMessage from "../successMessage";

const SelectAdModal = ({ isOpen, onClose, onUpdate, groupID, pinnedTvs }) => {
  const [ads, setAds] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Memoize fetchAllAds
  const fetchAllAds = useCallback(async () => {
    try {
      const response = await fetch("/api/advertisements");
      const data = await response.json();
      if (response.ok) {
        setAds(data);
      } else {
        throw new Error(data.error || "Failed to fetch ads");
      }
    } catch (error) {
      addNotification("Error", error.message || "An error occurred while fetching ads");
    }
  }, []);

  // Fetch all ads when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllAds();
    }
  }, [isOpen, fetchAllAds]);

  // Handle ad selection
  const handleAdSelect = (event) => {
    const selectedAdID = event.target.value;
    const ad = ads.find((ad) => ad.adID === selectedAdID);
    setSelectedAd(ad);
  };

  // Handle update
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedAd) {
      addNotification("Error", "Please select an ad.");
      return;
    }

    try {
      await onUpdate(selectedAd, pinnedTvs);
      onClose();
      addNotification("Success", "Advertisement updated successfully!");
    } catch (error) {
      addNotification("Error", error.message || "Failed to update group.");
    }
  };

  // Add a notification
  const addNotification = (type, message) => {
    const newNotification = {
      id: Date.now(),
      type,
      message,
    };
    setNotifications((prevNotifications) => [...prevNotifications, newNotification]);
  };

  // Remove a notification
  const handleCloseNotification = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  };

  // Automatically remove notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications((prevNotifications) => prevNotifications.slice(1));
      }, 5000);
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [notifications]);

  if (!isOpen) return null;

  return (
    <div className="select-ad-modal-overlay">
      <div className="select-ad-modal-content">
        <h2>Select Advertisement</h2>
        {notifications.map((notification) => (
          <AlertMessage
            key={notification.id}
            type={notification.type}
            message={notification.message}
            onClose={() => handleCloseNotification(notification.id)}
          />
        ))}
        <div className="select-ad-modal-ads-list">
          <select onChange={handleAdSelect} value={selectedAd?.adID || ""}>
            <option value="" disabled>
              Select an advertisement
            </option>
            {ads.map((ad) => (
              <option key={ad.adID} value={ad.adID}>
                {ad.adTitle}
              </option>
            ))}
          </select>
        </div>
        <div className="select-ad-modal-actions">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button onClick={handleUpdate} className="update-btn">
            Update All
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectAdModal;