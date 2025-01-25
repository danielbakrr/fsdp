import React, { useState, useEffect } from "react";
import "../styles/advDisplay.css";
import Navbar from "./navbar";
import { FaChevronRight } from "react-icons/fa";
import AddLocationModal from "./addLocationModal";
import "../styles/tailwind.css";
import AddButton from "./addButton";
import { useNavigate } from "react-router-dom";

const AdvertisementDisplay = () => {
  const [locations, setLocations] = useState([]); // Store locations
  const [tvs, setTvs] = useState([]); // Store TVs for selected location
  const [selectedLocation, setSelectedLocation] = useState(null); // Store selected location
  const [selectedTv, setSelectedTv] = useState(null); // Store selected TV
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state for selecting ad
  const [ads, setAds] = useState([]); // Store ads
  const [displayedAd, setDisplayedAd] = useState(null); // Store the ad to display
  const [locationAdded, setLocationAdded] = useState(false); // Track if location is added
  const [locationError, setLocationError] = useState(false); // Track if there was an error
  const [notifications, setNotifications] = useState([]); // Store notifications
  const navigate = useNavigate();

  useEffect(() => {
    fetchLocations(); // Fetch locations when the component mounts
  }, []);

  // Fetch the list of locations
  const fetchLocations = async () => {
    try {
      const response = await fetch("/locations");
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error); // Handle the error returned by the API
      }

      console.log("Locations data:", data);
      setLocations(data); // Set locations state
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };
  // Fetch TVs for the selected location
  const fetchTvs = async (locationId) => {
    try {
      const response = await fetch(`/locations/${locationId}/tvs`); // Endpoint to get TVs for a location
      const data = await response.json();
      setTvs(data); // Set the TVs for the selected location
    } catch (error) {
      console.error("Error fetching TVs:", error);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    navigate(`/advertisement-display/location/${location.locationId}`,{ state: { location } });
    setSelectedLocation(location); // Set the selected location
    setTvs([]); // Clear the TVs list before fetching new TVs
    fetchTvs(location.locationId); // Fetch TVs for the selected location
  };

  // Handle TV selection
  const handleTvSelect = (tv) => {
    setSelectedTv(tv); // Set the selected TV
    setIsModalOpen(true); // Open the modal to select an ad
  };

  // Handle ad selection
  const handleAdSelection = (ad) => {
    setDisplayedAd(ad.FileUrl); // Set the ad to display
    setIsModalOpen(false); // Close the modal
  };

  // Add new location after modal submission
  const handleAddLocation = (newLocation) => {
    try {
      // Simulate adding the new location (e.g., API call)
      setLocations((prevLocations) => [...prevLocations, newLocation]); // Update locations state with the new location

      // Set success message
      setLocationAdded(true);
      setLocationError(false);
      fetchLocations(); // Fetch locations again to update the list

      // Trigger success notification
      createNotification("success", "fa-solid fa-circle-check", "Success");
    } catch (error) {
      // If there's an error, set error message
      setLocationAdded(false);
      setLocationError(true);

      // Trigger error notification
      createNotification("error", "fa-solid fa-circle-exclamation", "Error");
    }
  };

  // Function to create notifications
  const createNotification = (type, icon, title) => {
    const newNotification = { type, icon, title };
    setNotifications((prevNotifications) => [
      ...prevNotifications,
      newNotification,
    ]);

    // Automatically remove the notification after 5 seconds
    setTimeout(() => {
      setNotifications((prevNotifications) =>
        prevNotifications.filter(
          (notification) => notification !== newNotification
        )
      );
    }, 5000);
  };

  return (
    <div className="Ad">
      <Navbar />
      <h1>TV Groups</h1>

      {/* New Location Button */}
      <div className="new-location-container">
        <AddButton onClick={() => setIsModalOpen(true)} label="Add" />
      </div>

      {/* Locations List */}
      <h3>TV Groups:</h3>
      <div className="locations-list">
        {locations.length > 0 ? (
          locations.map((location) => (
            <div
              key={location.locationId} // Use locationId as the key
              className="location-card"
              onClick={() => handleLocationSelect(location)}
            >
              <div className="location-info">
                <p>{location.locationName}</p>{" "}
                {/* Use locationName for display */}
              </div>
              <FaChevronRight className="location-arrow" />
            </div>
          ))
        ) : (
          <p>No locations available</p> // Fallback if locations array is empty
        )}
      </div>

      {/* TVs List for Selected Location */}
      {selectedLocation && (
        <div>
          <h3>TVs in {selectedLocation.locationName}:</h3>
          <div className="tvs-list">
            {tvs.map((tv) => (
              <div
                key={tv.id}
                className="tv-card"
                onClick={() => handleTvSelect(tv)}
              >
                <p>{tv.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display Selected Ad */}
      {displayedAd && (
        <div className="displayed-ad-container">
          {displayedAd.startsWith("http") ? (
            <img
              src={displayedAd}
              alt="Displayed Ad"
              className="displayed-ad"
            />
          ) : (
            <p>Unsupported file type</p>
          )}
        </div>
      )}

      {/* Modal for Adding New Location */}
      <AddLocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddLocation={handleAddLocation}
      />
    </div>
  );
};

export default AdvertisementDisplay;
