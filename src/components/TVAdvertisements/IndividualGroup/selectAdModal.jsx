import React, { useEffect, useState, useCallback } from "react";
import "./selectAdModal.css";
import AlertMessage from "../successMessage";

const SelectAdModal = ({ isOpen, onClose, onUpdate, groupID, pinnedTvs, createNotification }) => {
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
      createNotification("Error", error.message || "An error occurred while fetching ads");
    }
  }, [createNotification]); // Add createNotification to the dependency array

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
      createNotification("Error", "Please select an ad.");
      return;
    }

    try {
      await onUpdate(selectedAd, pinnedTvs);
      onClose();
      createNotification("Success", "Advertisement updated successfully!");
    } catch (error) {
      createNotification("Error", error.message || "Failed to update group.");
    }
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
    <>
      <div className="select-ad-modal-overlay">
        <div className="select-ad-modal-content">
          <h2>Select Advertisement</h2>
          <div className="select-ad-modal-ads-list">
            <select onChange={handleAdSelect} value={selectedAd?.adID || ""}>
              <option value="" disabled>Select an advertisement</option>
              {ads.map((ad) => (
                <option key={ad.adID} value={ad.adID}>
                  {ad.adTitle}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-4 mt-4">
            <button
              type="button"
              onClick={handleUpdate}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Update All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      
      <div className="notifications-container">
        {notifications.length > 0 && (
          <div>
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`notification ${notification.type}`}
                style={{
                  transform: `translateY(${index * 16}px)`,
                }}
              >
                <AlertMessage
                  type={notification.type}
                  message={notification.message}
                  onClose={() => handleCloseNotification(notification.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default SelectAdModal;