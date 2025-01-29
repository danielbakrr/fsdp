import React, { useEffect, useState } from "react";

const SelectAdModal = ({ isOpen, onClose, onUpdate, groupID, pinnedTvs }) => {
  const [ads, setAds] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [error, setError] = useState("");

  // Fetch all ads when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllAds();
    }
  }, [isOpen]);

  // Fetch all advertisements
  const fetchAllAds = async () => {
    try {
      const response = await fetch("/advertisements");
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
  const handleUpdate = () => {
    if (selectedAd) {
      onUpdate(selectedAd, pinnedTvs); // Pass selected ad and pinned TVs to the update function
      onClose();
    } else {
      setError("Please select an ad to update.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Select Advertisement</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="ads-list">
          <select onChange={handleAdSelect} value={selectedAd?.adID || ""}>
            <option value="" disabled>Select an advertisement</option>
            {ads.map((ad) => (
              <option key={ad.adID} value={ad.adID}>
                {ad.name}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleUpdate}>Update All</button>
        </div>
      </div>
    </div>
  );
};

export default SelectAdModal;
