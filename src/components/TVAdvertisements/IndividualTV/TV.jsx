import React, { useEffect, useState } from "react";
import { useLocation, Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../../navbar";
import "./TV.css";

const TV = () => {
  const { groupID, tvID } = useParams();
  const { state, search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const groupNameFromUrl = queryParams.get("groupName");
  const storedGroupName = localStorage.getItem("groupName");
  const groupName =
    state?.group?.groupName ||
    groupNameFromUrl ||
    storedGroupName ||
    "Unknown Group";

  const [adsList, setAdsList] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tvs, setTvs] = useState([]);

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
    const newAdID = event.target.value;
    const selectedAdObject = adsList.find((ad) => ad.adID === newAdID);
    setSelectedAd(selectedAdObject);
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

  const isVideo = (url) => {
    return url.match(/\.(mp4|webm|ogg)$/i);
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
          to={`/advertisement-display/tvgroups/${groupID}?groupName=${encodeURIComponent(
            groupName
          )}`}
          className="breadcrumb-link"
        >
          {groupName}
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
              {selectedAd && selectedAd.mediaUrl ? (
                isVideo(selectedAd.mediaUrl) ? (
                  <video controls autoPlay loop className="ad-video">
                    <source src={selectedAd.mediaUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={selectedAd.mediaUrl}
                    alt={`Ad for TV ${tvID}`}
                    className="ad-image"
                  />
                )
              ) : (
                <p>No ad selected</p>
              )}
            </div>

            <div className="ad-selector">
              <label htmlFor="ad-select">Select Advertisement:</label>
              <select
                id="ad-select"
                value={selectedAd?.adID || ""}
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
