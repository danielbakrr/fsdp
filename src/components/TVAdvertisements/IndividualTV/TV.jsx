import React, { useEffect, useState } from "react";
import { useLocation, Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../../navbar";
import "./TV.css";

const TV = () => {
  const { groupID, tvID } = useParams();
  const { state } = useLocation();

  const [adsList, setAdsList] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllAds();
  }, []);

  const fetchAllAds = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/advertisements");
      if (!response.ok) {
        throw new Error("Failed to fetch advertisements");
      }
      const data = await response.json();
      setAdsList(data);
      if (data.length > 0) {
        setSelectedAd(data[0]);
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
      setError("Failed to load advertisements. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdChange = (event) => {
    const newAd = adsList.find((ad) => ad.adID === event.target.value);
    setSelectedAd(newAd);
  };

  const handleConfirm = async () => {
    if (!selectedAd) {
      setError("Please select an advertisement.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/tvgroups/${groupID}/tvs/${tvID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adID: selectedAd.adID }),
      });

      if (!response.ok) {
        throw new Error("Failed to update advertisement.");
      }

      const result = await response.json();
      console.log(result.message);
      alert("Advertisement updated successfully!");
    } catch (error) {
      console.error("Error updating advertisement:", error);
      setError("Failed to update advertisement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="TV">
      <Navbar />

      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <Link to="/advertisement-display" className="breadcrumb-link">
          Group
        </Link>{" "}
        &gt;{" "}
        <Link
          to={`/advertisement-display/tvgroups/${groupID}`}
          className="breadcrumb-link"
        >
          {state?.group?.groupName || "Unknown Group"}
        </Link>{" "}
        &gt; <span className="breadcrumb-current">TV {tvID}</span>
      </div>

      <div className="tv-container">
        <h1>TV {tvID}</h1>

        {loading ? (
          <p>Loading advertisements...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : selectedAd ? (
          <>
            <div className="ad-preview">
              <img
                src={selectedAd.imageUrl}
                alt={`Ad for TV ${tvID}`}
                className="ad-image"
              />
            </div>

            <div className="ad-selector">
              <label htmlFor="ad-select">Select Advertisement:</label>
              <select
                id="ad-select"
                value={selectedAd.adID}
                onChange={handleAdChange}
              >
                {adsList.map((ad) => (
                  <option key={ad.adID} value={ad.adID}>
                    {ad.adTitle}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="confirm-button"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? "Updating..." : "Confirm Advertisement"}
            </button>
          </>
        ) : (
          <p>No advertisements available.</p>
        )}
      </div>
    </div>
  );
};

export default TV;
