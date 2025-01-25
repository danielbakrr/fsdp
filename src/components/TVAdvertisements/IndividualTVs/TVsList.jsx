import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link, useParams } from "react-router-dom";
import Navbar from "./navbar";
import "../../../styles/TVsList.css";
import AddTvButton from "./addTVButton";

const TVsList = () => {
  const { locationId } = useParams();
  const [tvs, setTvs] = useState([]);
  const [ads, setAds] = useState({});
  const [selectedTvs, setSelectedTvs] = useState([]);
  const [pinnedTvs, setPinnedTvs] = useState([]);
  const [error, setError] = useState("");
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (state?.location) {
      fetchTvs(state.location.locationId);
    }
  }, [state]);

  const fetchTvs = async (locationId) => {
    try {
      const response = await fetch(`/locations/${locationId}/tvs`);
      const tvData = await response.json();
      if (Array.isArray(tvData)) {
        setTvs(tvData);
      }
      const adPromises = tvData.map(async (tv) => {
        if (tv.adID) {
          const adResponse = await fetch(`/realAds/${tv.adID}`);
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
    }
  };

  const handleAddTv = async () => {
    setError("");
    try {
      const response = await fetch(`/locations/${locationId}/tvs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locationId }),
      });
      const data = await response.json();
      if (response.ok) {
        setTvs((prevTvs = []) => [...prevTvs, data.tvData]);
      } else {
        setError(data.error || "Failed to add TV");
      }
    } catch (error) {
      setError(error.message || "An error occurred");
    }
  };

  const handleDeleteMultipleTv = async () => {
    setError("");
    try {
      const response = await fetch(`/locations/${locationId}/tvs/batch-delete`, {
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

  const handleDeleteTv = async () => {
    setError("");
    try {
      if (pinnedTvs.length === 1) {
        const tvID = pinnedTvs[0];
        const response = await fetch(`/locations/${locationId}/tvs/${tvID}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locationId,
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

  const togglePin = (tvID) => {
    setPinnedTvs((prevPinned) => {
      if (prevPinned.includes(tvID)) {
        return prevPinned.filter((id) => id !== tvID);
      } else {
        return [...prevPinned, tvID];
      }
    });
  };

  const groupSelectedTvs = () => {
    navigate("/tv-groups", { state: { selectedTvs: pinnedTvs } });
  };

  const updateAllAds = () => {
    console.log("Updating ads for TVs:", pinnedTvs);
  };

  return (
    <div className="tvs-page">
      <Navbar />
      <div className="breadcrumb">
        <Link to="/advertisement-display" className="breadcrumb-link">
          Location
        </Link>{" "}
        &gt;
        <span> {state?.location?.locationName}</span>
      </div>

      <div className="tvs-header-container">
        <div className="text">Available TVs</div>
        <div className="tv-button-container">
          <button className="update-ad-button">
            <p>Update All</p>
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

                <h1>{`TV ${tv.tvID}`}</h1>

                {ad && ad.imageUrl ? (
                  <a
                    href={`/tvs/${tv.tvID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src={ad.imageUrl} alt={`Ad for TV ${tv.tvID}`} />
                  </a>
                ) : (
                  <p>No ad available</p>
                )}
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
    </div>
  );
};

export default TVsList;
