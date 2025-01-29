import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link, useParams } from "react-router-dom";
import Navbar from "../../navbar";
import "../../../styles/TVsList.css";
import AddTvButton from "./addTVButton";
import UpdateAll from "./updateAllButton";

const TVsList = () => {
  const { groupID } = useParams();
  const [tvs, setTvs] = useState([]);
  const [ads, setAds] = useState({});
  const [pinnedTvs, setPinnedTvs] = useState([]);
  const [error, setError] = useState("");
  const { state } = useLocation();
  const navigate = useNavigate();

  // Fetch TVs and ads on component mount and every 3 seconds
  useEffect(() => {
    if (state?.group?.groupName) {
      localStorage.setItem("groupName", state.group.groupName);
    }
    fetchTvs(groupID);
    const intervalId = setInterval(() => {
      fetchTvs(groupID);
    }, 3000);
    return () => clearInterval(intervalId);
  }, [state, groupID]);
  
  // Fetch TVs and their associated ads
  const fetchTvs = async (groupID) => {
    try {
      const response = await fetch(`/tvgroups/${groupID}/tvs`);
      const tvData = await response.json();

      if (Array.isArray(tvData)) {
        setTvs(tvData);
      }

      // Fetch ads for each TV
      const adPromises = tvData.map(async (tv) => {
        if (tv.adID) {
          const adResponse = await fetch(`/advertisements/${tv.adID}`);
          const adData = await adResponse.json();
          return { [tv.tvID]: adData };
        }
        return null;
      });

      const adResults = await Promise.all(adPromises);
      const adMap = adResults.reduce((acc, ad) => {
        if (ad) {
          acc = { ...acc, ...ad };
        }
        return acc;
      }, {});
      setAds(adMap);
    } catch (error) {
      console.error("Error fetching TVs or ads:", error);
      setError("Failed to fetch TVs or ads. Please try again.");
    }
  };

  // Add a new TV
  const handleAddTv = async () => {
    setError("");
    try {
      const response = await fetch(`/tvgroups/${groupID}/tvs`, {
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
      const response = await fetch(`/tvgroups/${groupID}/tvs/batch-delete`, {
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
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete TVs");
      }
    } catch (error) {
      setError(error.message || "An error occurred");
    }
  };

  // Delete a single TV
  const handleDeleteTv = async () => {
    setError("");
    try {
      if (pinnedTvs.length === 1) {
        const tvID = pinnedTvs[0];
        const response = await fetch(`/tvgroups/${groupID}/tvs/${tvID}`, {
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
          setError(data.error || "Failed to delete TV");
        }
      } else {
        setError("Please select only one TV to delete.");
      }
    } catch (error) {
      setError(error.message || "An error occurred");
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

  // Group selected TVs
  const groupSelectedTvs = () => {
    navigate("/tv-groups", { state: { selectedTvs: pinnedTvs } });
  };

  // Update ads for selected TVs
  const updateAllAds = () => {
    console.log("Updating ads for TVs:", pinnedTvs);
    // Implement logic to update ads for selected TVs
  };

  // Update all TVs
  const updateAllTvs = () => {
    console.log("Updating all TVs");
    // Implement logic to update all TVs
  };

  return (
    <div className="tvs-page">
      <Navbar />
      <div className="breadcrumb">
        <Link to="/advertisement-display" className="breadcrumb-link">
          Group
        </Link>{" "}
        &gt;
        <Link
          to={`/advertisement-display/tvgroups/${groupID}?groupName=${encodeURIComponent(
            state?.group?.groupName ||
              localStorage.getItem("groupName") ||
              "Unknown Group"
          )}`}
          className="breadcrumb-link"
        >
          {state?.group?.groupName ||
            localStorage.getItem("groupName") ||
            "Unknown Group"}
        </Link>
      </div>

      <div className="tvs-header-container">
        <div className="text">Available TVs</div>
        <div className="tv-button-container">
          <button onClick={updateAllTvs}>
            <UpdateAll />
          </button>
          <button onClick={handleAddTv}>
            <AddTvButton />
          </button>
        </div>
      </div>

      <div className="tvs-list">
        {tvs.length > 0 ? (
          tvs.map((tv, index) => {
            const ad = ads[tv.tvID];
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
                  {ad && ad.imageUrl ? (
                    <img src={ad.imageUrl} alt={`Ad for TV ${tv.tvID}`} />
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
              <button onClick={updateAllAds}>Update All</button>
              <button onClick={groupSelectedTvs}>Group TVs</button>
            </>
          )}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default TVsList;
