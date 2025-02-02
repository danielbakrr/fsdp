import React, { useEffect, useState, useRef } from "react";
import { useLocation, Link, useParams } from "react-router-dom";
import Navbar from "../../navbar";
import "./TV.css";
import "./SelectFileDropdown.css";
import AdPreview from "./adPreview"; 
import { jwtDecode } from "jwt-decode";
import io from "socket.io-client";
const socket = io.connect("https://githubbiesbackend.onrender.com"); // Adjust to your backend URL

const TV = () => {
  const { groupID, tvID } = useParams();
  const { state, search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const groupNameFromUrl = queryParams.get("groupName");
  const storedGroupName = localStorage.getItem("groupName");
  const [userFeatures, setUserFeatures] = useState([]);
  const features = [
    "Tv Groups",
    "Template Editor",
    "Advertisement Management",
    "User Management",
    "Metrics",
    "Schedule Ads",
  ];

  const decodeToken = () => {
    const token = localStorage.getItem("token");
    if (token != null) {
      const decodedToken = jwtDecode(token);
      console.log(JSON.stringify(decodedToken, null, 2));
      const role = decodedToken.permissions;
      const temp = [];
      const permissions = role.permissions;
      if (Array.isArray(permissions) && permissions.length > 0) {
        permissions.forEach((element) => {
          console.log(element.resource);
          for (let i = 0; i < features.length; i++) {
            if (features[i].includes(element.resource)) {
              temp.push(features[i]);
            }
          }
        });
      }
      setUserFeatures(temp);
    }
  };

  const groupName =
    state?.group?.groupName ||
    groupNameFromUrl ||
    storedGroupName ||
    "Unknown Group";

  const [adsList, setAdsList] = useState([]); // List of all ads
  const [currentAd, setCurrentAd] = useState(null); // Current ad being displayed on the TV
  const [selectedAd, setSelectedAd] = useState(null); // Selected ad in the dropdown
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(""); // Error message

  useEffect(() => {
    decodeToken();
    const fetchCurrentAd = async () => {
      setError("");
      try {
        const tvResponse = await fetch(`/api/tvgroups/${groupID}/tvs/${tvID}`);
        if (!tvResponse.ok) {
          throw new Error("Failed to fetch TV details");
        }
        const tvData = await tvResponse.json();

        const adsResponse = await fetch("/api/Advertisements");
        if (!adsResponse.ok) {
          throw new Error("Failed to fetch advertisements");
        }
        const adsData = await adsResponse.json();

        const currentAd = tvData.adID
          ? adsData.find((ad) => ad.adID === tvData.adID)
          : null;
        setCurrentAd(currentAd);
        setAdsList(adsData);
      } catch (error) {
        console.error("Error fetching current ad:", error);
        setError("Failed to load current ad. Please try again.");
      }
    };

    // Fetch all ads for the dropdown
    fetchAllAds();

    socket.emit("join_tv", { tvID: tvID, user_id: "some_user_id" });
    socket.on("receive_message", (data) => {
      setCurrentAd(data.message);
    });

    // Fetch the current ad periodically
    const intervalId = setInterval(() => {
      fetchCurrentAd();
    }, 5000);

    return () => {
      clearInterval(intervalId);
      socket.off("receive_message");
      socket.emit("leave_tv", { tvID: tvID, user_id: "some_user_id" }); // Leave the room when unmounting
    };
  }, [tvID, groupID]); // Add groupID to the dependency array

  // Fetch all ads
  const fetchAllAds = async () => {
    socket.emit("join_tv", tvID); 
    setError("");
    setLoading(true);
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

  // Handle ad selection in the dropdown
  const handleAdChange = (ad) => {
    setSelectedAd(ad);
  };

  // Handle confirmation of the selected ad
  const handleConfirm = async () => {
    if (!selectedAd) {
      setError("Please select an advertisement.");
      return;
    }

    setError("");
    try {
      const response = await fetch(`/api/tvgroups/${groupID}/tvs/${tvID}`, {
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
      socket.emit("send_message", { message: selectedAd, tv: tvID });

    } catch (error) {
      console.error("Error updating advertisement:", error);
      setError("Failed to update advertisement. Please try again.");
    }
  };

  return (
    <div className="TV">
      <Navbar navItems={userFeatures} />

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
        ) : (
          <>
            {/* Left Column: Select Advertisement */}
            <div className="ad-selector">
              <div className="dropdown">
                <input
                  hidden=""
                  className="sr-only"
                  name="state-dropdown"
                  id="state-dropdown"
                  type="checkbox"
                />
                <label
                  aria-label="dropdown scrollbar"
                  htmlFor="state-dropdown"
                  className="trigger"
                ></label>
                <ul className="list webkit-scrollbar" role="list" dir="auto">
                  {adsList.map((ad) => (
                    <li
                      key={ad.adID}
                      className={`listitem ${
                        selectedAd?.adID === ad.adID ? "selected" : ""
                      }`}
                      role="listitem"
                      onClick={() => handleAdChange(ad)}
                    >
                      <article className="article">{ad.adTitle}</article>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confirm Button */}
              <button
                className="confirm-button"
                onClick={handleConfirm}
                disabled={!selectedAd}
              >
                Push Ad
              </button>
            </div>

            {/* Ad Preview Section */}
            <div className="ad-preview">
  <h2>Ad Preview</h2>
  <div
    style={{
      width: "75vw", 
      height: "75vh", 
    }}
  >
    <AdPreview ad={currentAd} /> {/* Use the AdPreview component */}
  </div>
</div>
          </>
        )}
      </div>
    </div>
  );
};

export default TV;