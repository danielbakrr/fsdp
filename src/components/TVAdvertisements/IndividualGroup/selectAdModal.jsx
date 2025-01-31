import React, { useEffect, useState } from "react";
import './selectAdModal.css'; // Import the scoped CSS file for styling
import AlertMessage from "../successMessage"; // Import the AlertMessage component

const SelectAdModal = ({ isOpen, onClose, onUpdate, groupID, pinnedTvs }) => {
  const [ads, setAds] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [alertType, setAlertType] = useState(""); // 'Success' or 'Error'

  // Fetch all ads when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllAds();
    }
  }, [isOpen]);

  // Fetch all advertisements
  const fetchAllAds = async () => {
    try {
      const response = await fetch("/api/advertisements");
      const data = await response.json();
      if (response.ok) {
        setAds(data);
      } else {
        setError(data.error || "Failed to fetch ads");
      }
    } catch (error) {
      setError(error.message || "An error occurred while fetching ads");
    }
  };

  // Handle ad selection
  const handleAdSelect = (event) => {
    const selectedAdID = event.target.value;
    const ad = ads.find((ad) => ad.adID === selectedAdID);
    setSelectedAd(ad);
  };

  // Handle update
  const handleUpdate = async () => {
    if (selectedAd) {
      try {
        await onUpdate(selectedAd, pinnedTvs); // Pass selected ad and pinned TVs to the update function
        setAlertType("Success");
        setSuccess("TVs updated successfully!");
        setError(""); // Clear error if successful
        onClose();
      } catch (err) {
        setAlertType("Error");
        setError(err.message || "Failed to update TVs.");
        setSuccess(""); // Clear success message if error occurs
      }
    } else {
      setAlertType("Error");
      setError("Please select an ad to update.");
      setSuccess(""); // Clear success message if no ad is selected
    }
  };

  if (!isOpen) return null;

  return (
    <div className="select-ad-modal-overlay">
      <div className="select-ad-modal-content">
        <h2>Select Advertisement</h2>
        {alertType && (
          <AlertMessage
            type={alertType}
            message={alertType === "Success" ? success : error}
            onClose={() => {
              setAlertType("");
              setSuccess("");
              setError("");
            }}
          />
        )}
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
        <div className="select-ad-modal-actions">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={handleUpdate} className="update-btn">Update All</button>
        </div>
      </div>
    </div>
  );
};

export default SelectAdModal;
