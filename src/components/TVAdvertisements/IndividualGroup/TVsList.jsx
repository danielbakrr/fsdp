import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link, useParams } from "react-router-dom";
import Navbar from "../../navbar";
import "./TVsList.css";
import { jwtDecode } from 'jwt-decode';
import AddTvButton from "./addTVButton";
import UpdateAll from "./updateAllButton";
import SelectAdModal from "./selectAdModal";
import AlertMessage from "../successMessage"; // Ensure this is imported
import io from "socket.io-client";
const socket = io.connect("https://githubbiesbackend.onrender.com"); // Adjust to your backend URL

const TVsList = () => {
  const { groupID, tvID } = useParams();
  const [tvs, setTvs] = useState([]);
  const [ads, setAds] = useState({});
  const [pinnedTvs, setPinnedTvs] = useState([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState([]); // Store notifications
  const { state } = useLocation();
  const navigate = useNavigate();
  const [userFeatures,setUserFeatures] = useState([]);
  const features = ["Tv Groups", "Template Editor", "Advertisement Management", "User Management", "Metrics", "Schedule Ads"];
  
  const decodeToken = ()=> {
        const token = localStorage.getItem('token');
        if(token != null){
          const decodedToken = jwtDecode(token);
          console.log(JSON.stringify(decodedToken,null,2));
          const role = decodedToken.permissions;
          const temp = [];
          const permissions = role.permissions;
          if(Array.isArray(permissions) && permissions.length > 0){
            permissions.forEach(element => {
              console.log(element.resource);
              for(let i = 0; i< features.length; i++){
                if(features[i].includes(element.resource)){
                  temp.push(features[i]);
                }
              }
            });
          }
          setUserFeatures(temp);
    
        }
  }

  // Create a notification
  const createNotification = (type, message) => {
    const newNotification = {
      id: Date.now(),
      type,
      message,
    };
    setNotifications((prevNotifications) => [...prevNotifications, newNotification]);
  };

  // Close a notification
  const handleCloseNotification = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  };

  // useEffect with no dependency 
  useEffect(()=> {
    decodeToken();
  },[])
  // Automatically remove notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications((prevNotifications) => prevNotifications.slice(1));
      }, 5000);
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [notifications]);

  // Check if a URL is a video
  const isVideo = (url) => {
    const videoExtensions = [".mp4", ".webm", ".ogg"];
    return videoExtensions.some((ext) => url.endsWith(ext));
  };

  // Fetch TVs and ads on component mount and every 3 seconds
  useEffect(() => {
    
    socket.emit("join_tv", { tvID: tvID, user_id: "some_user_id" });

    if (state?.group?.groupName) {
      localStorage.setItem("groupName", state.group.groupName);
    }

    fetchTvs(groupID);
    fetchAds(); // Fetch all ads
    const intervalId = setInterval(() => {
      fetchTvs(groupID);
      fetchAds(); // Refresh ads every 3 seconds
    }, 3000);
    return () => clearInterval(intervalId);
  }, [state, groupID]);

  // Fetch TVs
  const fetchTvs = async (groupID) => {
    try {
      const response = await fetch(`/api/tvgroups/${groupID}/tvs`);
      const tvData = await response.json();
      if (Array.isArray(tvData)) {
        setTvs(tvData);
      }
    } catch (error) {
      console.error("Error fetching TVs:", error);
      setError("Failed to fetch TVs. Please try again.");
    }
  };

  // Fetch all ads
  const fetchAds = async () => {
    try {
      const response = await fetch("/api/Advertisements");
      const data = await response.json();
      setAds(data.reduce((acc, ad) => ({ ...acc, [ad.adID]: ad }), {}));
    } catch (error) {
      console.error("Error fetching ads:", error);
      setError("Failed to fetch ads. Please try again.");
    }
  };

  // Add a new TV
  const handleAddTv = async () => {
    setError("");
    try {
      const response = await fetch(`/api/tvgroups/${groupID}/tvs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupID }),
      });
      const data = await response.json();
      if (response.ok) {
        setTvs((prevTvs) => [...prevTvs, data.tvData]);
      } else {
        setError(data.error || "Failed to add TV");
      }
    } catch (error) {
      setError(error.message || "An error occurred");
    }
  };

  // Delete multiple TVs
  const handleDeleteMultipleTv = async () => {
    setError("");
    try {
      const response = await fetch(`/api/tvgroups/${groupID}/tvs/batch-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tvIds: pinnedTvs }),
      });

      if (response.ok) {
        const updatedTvs = tvs.filter((tv) => !pinnedTvs.includes(tv.tvID));
        setTvs(updatedTvs);
        setPinnedTvs([]);
        createNotification("success", "TVs deleted successfully");
      } else {
        const data = await response.json();
        createNotification("error", "Error deleting TVs");
      }
    } catch (error) {
      createNotification("error", "Error deleting TVs");
    }
  };

  // Delete a single TV
  const handleDeleteTv = async () => {
    setError("");
    try {
      if (pinnedTvs.length === 1) {
        const tvID = pinnedTvs[0];
        const response = await fetch(`/api/tvgroups/${groupID}/tvs/${tvID}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupID,
            tvID,
          }),
        });

        if (response.ok) {
          const updatedTvs = tvs.filter((tv) => tv.tvID !== tvID);
          setTvs(updatedTvs);
          setPinnedTvs([]);
        } else {
          const data = await response.json();
        }
      }
    } catch (error) {
      console.error("Error deleting TV:", error);
    }
  };

  // Toggle pin for a TV
  const togglePin = (tvID) => {
    setPinnedTvs((prevPinned) => {
      if (prevPinned.includes(tvID)) {
        return prevPinned.filter((id) => id !== tvID);
      } else {
        return [...prevPinned, tvID];
      }
    });
  };

  // Update ads for selected TVs
  const updateSelectedTvs = async (selectedAd, pinnedTvs) => {
    setError("");
    try {
      const response = await fetch(`/api/tvgroups/${groupID}/tvs/batch-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tvIds: pinnedTvs, adID: selectedAd.adID }),
      });

      if (response.ok) {
        fetchTvs(groupID);
      } else {
        const data = await response.json();
      }
    } catch (error) {
      console.error("Error updating ad:", error);
    }
  };

  // Update ads for all TVs
  const updateAllTvs = async (selectedAd) => {
    setError("");
    try {
      const tvIds = tvs.map((tv) => tv.tvID);
      const response = await fetch(`/api/tvgroups/${groupID}/tvs/batch-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tvIds, adID: selectedAd.adID }),
      });
      if (response.ok) {
        fetchTvs(groupID);
      }
    } catch (error) {
      console.error("Error updating all TVs:", error);
    }
  };

  return (
    <div className="tvs-page">
      <Navbar
        navItems={userFeatures} 
      />
      <div className="breadcrumb">
        <Link to="/advertisement-display" className="breadcrumb-link">
          Group
        </Link>{" "}
        &gt;{" "}
        <span className="breadcrumb-current">
          {localStorage.getItem("groupName") || "Unknown Group"}
        </span>
      </div>
      <div className="tvs-header-container">
        <div className="text">Available TVs</div>
        <div className="tv-button-container">
          <button onClick={() => setShowModal(true)}>
            <UpdateAll />
          </button>
          <button onClick={handleAddTv}>
            <AddTvButton />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="notifications-container">
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

      <div className="tvs-list">
        {tvs.length > 0 ? (
          tvs.map((tv, index) => {
            const ad = ads[tv.adID]; // Get the ad for the current TV
            const isPinned = pinnedTvs.includes(tv.tvID);
            return (
              <div
                key={index}
                className={`tv-card ${isPinned ? "pinned" : ""}`}
              >
                {/* Pin Button (Outside the Link) */}
                <label className="container">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={() => togglePin(tv.tvID)}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 75 100"
                    className="pin"
                  >
                    <line
                      strokeWidth={12}
                      stroke="black"
                      y2={100}
                      x2={37}
                      y1={64}
                      x1={37}
                    />
                    <path
                      strokeWidth={10}
                      stroke="black"
                      d="M16.5 36V4.5H58.5V36V53.75V54.9752L59.1862 55.9903L66.9674 67.5H8.03256L15.8138 55.9903L16.5 54.9752V53.75V36Z"
                    />
                  </svg>
                </label>

                {/* Card Content (Inside the Link) */}
                <Link
                  to={`/advertisement-display/tvgroups/${groupID}/tvs/${tv.tvID}`}
                  className="tv-card-link"
                  state={{ group: { groupName: state?.group?.groupName } }}
                >
                  <h1>{`TV ${tv.tvID}`}</h1>
                  {ad && ad.mediaItems?.length > 0 ? (
                    <div className="ad-mini-view">
                      {ad.mediaItems.map((mediaItem, index) => {
                        const mediaUrl = mediaItem.url;
                        return (
                          <div
                            key={index}
                            className="media-item"
                            style={{
                              width: "100px",
                              height: "100px",
                              border: "1px solid #ddd",
                              borderRadius: "8px",
                              overflow: "hidden",
                              margin: "5px",
                            }}
                          >
                            {mediaItem.type === "text" ? (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "#f0f0f0",
                                  fontSize: "12px",
                                  padding: "5px",
                                }}
                              >
                                <p>{mediaItem.text}</p>
                              </div>
                            ) : isVideo(mediaUrl) ? (
                              <video
                                src={mediaUrl}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                controls={false}
                                muted
                                loop
                              />
                            ) : (
                              <img
                                src={mediaUrl}
                                alt={`Ad media item ${index + 1} for TV ${tv.tvID}`}
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
                  ) : (
                    <p>No ad available - Click to select an ad</p>
                  )}
                </Link>
              </div>
            );
          })
        ) : (
          <p>No TVs available</p>
        )}
      </div>

      {pinnedTvs.length > 0 && (
        <div className="selection-mode">
          {pinnedTvs.length === 1 ? (
            <button onClick={handleDeleteTv}>Delete TV</button>
          ) : (
            <>
              <button onClick={handleDeleteMultipleTv}>Delete Selected</button>
              <button onClick={() => setShowModal(true)}>Update All</button>
            </>
          )}
        </div>
      )}

      {/* Render the SelectAdModal */}
      <SelectAdModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUpdate={pinnedTvs.length > 1 ? updateSelectedTvs : updateAllTvs}
        groupID={groupID}
        pinnedTvs={pinnedTvs}
        createNotification={createNotification}
      />
    </div>
  );
};

export default TVsList;