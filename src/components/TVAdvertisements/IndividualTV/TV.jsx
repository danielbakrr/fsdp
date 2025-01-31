import React, { useEffect, useState, useRef } from "react";
import { useLocation, Link, useParams } from "react-router-dom";
import Navbar from "../../navbar";
import "./TV.css";
import SocketIOClient from "../../../websocket/WebsocketClient";

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

  const [adsList, setAdsList] = useState([]); // List of all ads
  const [currentAd, setCurrentAd] = useState(null); // Current ad being displayed on the TV
  const [selectedAd, setSelectedAd] = useState(null); // Selected ad in the dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const socketClient = useRef(null);

  useEffect(() => {
    // Initialize WebSocket client
    socketClient.current = new SocketIOClient("http://localhost:5000");
    socketClient.current.connect();

    socketClient.current.joinTV(tvID);

    // Fetch the current ad for the TV
    fetchCurrentAd();
    // Fetch all ads for the dropdown
    fetchAllAds();

    // Handle incoming ad updates
    socketClient.current.onMessage((data) => {
      if (data.ad.adID === currentAd?.adID) {
        // If the updated ad is the current ad, update the preview
        setCurrentAd(data.ad);
      }
    });

    return () => {
      socketClient.current.disconnect();
    };
  }, [tvID]);

  const fetchAllAds = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/Advertisements");
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

  // Fetch the current ad for the TV
  const fetchCurrentAd = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch the TV object to get the current adID
      const tvResponse = await fetch(`/tvgroups/${groupID}/tvs/${tvID}`);
      if (!tvResponse.ok) {
        throw new Error("Failed to fetch TV details");
      }
      const tvData = await tvResponse.json();

      // Fetch all ads
      const adsResponse = await fetch("/api/Advertisements");
      if (!adsResponse.ok) {
        throw new Error("Failed to fetch advertisements");
      }
      const adsData = await adsResponse.json();

      // Find the current ad using the adID from the TV object
      const currentAd = tvData.adID
        ? adsData.find((ad) => ad.adID === tvData.adID)
        : null;
      setCurrentAd(currentAd);
      setAdsList(adsData); // Set the ads list for the dropdown
    } catch (error) {
      console.error("Error fetching current ad:", error);
      setError("Failed to load current ad. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle ad selection in the dropdown
  const handleAdChange = (event) => {
    const newAdID = event.target.value;
    const selectedAdObject = adsList.find((ad) => ad.adID === newAdID);
    setSelectedAd(selectedAdObject);
  };

  // Handle confirmation of the selected ad
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

      // Update the current ad state
      setCurrentAd(selectedAd);

      // Broadcast the update via WebSocket
      if (socketClient.current && socketClient.current.send) {
        socketClient.current.send({ type: "ad_update", ad: selectedAd });
      }

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
        </Link>
        &gt;
        <Link
          to={`/advertisement-display/tvgroups/${groupID}?groupName=${encodeURIComponent(
            groupName
          )}`}
          className="breadcrumb-link"
        >
          {groupName}
        </Link>
        &gt; <span className="breadcrumb-current">TV {tvID}</span>
      </div>

      <div className="tv-container">
        {loading ? (
          <p>Loading advertisements...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <>
            <div className="ad-preview">
              <h2>Ad Preview</h2>
              <div className="ad-preview-container">
                {currentAd ? (
                  currentAd.mediaItems.map((mediaItem) => (
                    <div
                      key={mediaItem.id}
                      style={{
                        scale: "0.8",
                        position: "absolute",
                        left: `${mediaItem.metadata.x}px`,
                        top: `${mediaItem.metadata.y}px`,
                        width: `${mediaItem.metadata.width}px`,
                        height: `${mediaItem.metadata.height}px`,
                      }}
                      className="ad-media-item"
                    >
                      {mediaItem.type === "video" ? (
                        <video
                          src={mediaItem.url}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          controls
                        />
                      ) : (
                        <img
                          src={mediaItem.url}
                          alt={`${currentAd.adTitle} - ${mediaItem.id}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <p>No ad selected</p>
                )}
              </div>
            </div>

            <div className="ad-selector">
              <label htmlFor="ad-select">Select Advertisement:</label>
              <select
                id="ad-select"
                value={selectedAd?.adID || ""}
                onChange={handleAdChange}
              >
                <option value="">Select an ad</option>
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
              disabled={loading || !selectedAd}
            >
              {loading ? "Updating..." : "Confirm Advertisement"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TV;
