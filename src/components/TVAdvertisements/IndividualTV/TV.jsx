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

  const [adsList, setAdsList] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectedTVs, setConnectedTVs] = useState([]);
  const socketClient = useRef(null);

  useEffect(() => {
    fetchAllAds();
    // Initialize WebSocket client
    socketClient.current = new SocketIOClient("http://localhost:5000");
    socketClient.current.connect();

    socketClient.current.joinTV(tvID);

    // Fetch initial ads for this TV
    const fetchAds = async () => {
      const response = await fetch(
        `http://localhost:5000/advertisement?tvID=${tvID}`
      );
      const data = await response.json();
      setAdsList(data);
    };
    fetchAds();

    // Handle incoming ad updates
    socketClient.current.onMessage((data) => {
      if (data.ad.tvID === tvID) {
        setAdsList((prevAds) => {
          const existingAdIndex = prevAds.findIndex(
            (ad) => ad.adID === data.ad.adID
          );
          if (existingAdIndex !== -1) {
            const newAds = [...prevAds];
            newAds[existingAdIndex] = data.ad;
            return newAds;
          } else {
            return [...prevAds, data.ad];
          }
        });
      }
    });

    // Handle TV connection changes
    socketClient.current.onConnectionChange((isConnected, tvID) => {
      if (isConnected) {
        setConnectedTVs((prev) => [...prev, tvID]);
      } else {
        setConnectedTVs((prev) => prev.filter((id) => id !== tvID));
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
        {loading ? (
          <p>Loading advertisements...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : selectedAd ? (
          <>
            <div className="ad-preview">
              <div style={{ userSelect: "none" }}>
                <h2>Ad Preview</h2>
                <div>
                </div>
                <div
                  style={{
                    position: "relative",
                    width: "830px",
                    height: "450px",
                    border: "1px solid #000",
                    justifyContent: "center",
                  }}
                ></div>
                {adsList.map((ad) => {
                  const mediaUrl = ad.mediaUrl || ""; // Ensure mediaUrl is a string
                  return (
                    <div
                      key={ad.adID}
                      style={{
                        position: "absolute",
                        left: `${ad.metadata?.x || 0}px`,
                        top: `${ad.metadata?.y || 0}px`,
                        width: `${ad.metadata?.width || 100}px`,
                        height: `${ad.metadata?.height || 100}px`,
                        border: "1px solid #000",
                        overflow: "hidden",
                      }}
                    >
                      {mediaUrl.endsWith(".mp4") ||
                      mediaUrl.endsWith(".webm") ||
                      mediaUrl.endsWith(".ogg") ? (
                        <video
                          controls
                          autoPlay
                          loop
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        >
                          <source src={mediaUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={ad.adTitle || "Advertisement"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
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
