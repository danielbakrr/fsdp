import React, { useState, useEffect } from "react";
import AlertMessage from "../../../styles/alertMessage"; // Import the updated AlertMessage component

const AddLocationModal = ({ isOpen, onClose, onAddLocation }) => {
  const [locationId, setLocationId] = useState("");
  const [address, setAddress] = useState("");
  const [locationName, setLocationName] = useState("");
  const [notifications, setNotifications] = useState([]); // Store notifications

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!locationId || !address || !locationName) {
      const newNotification = {
        id: Date.now(),
        type: "Error",
        message: "Please fill in all fields.",
      };

      setNotifications((prevNotifications) => [
        ...prevNotifications,
        newNotification,
      ]);

      // Reset form fields
      setLocationId("");
      setAddress("");
      setLocationName("");

      setTimeout(() => {
        onClose();
      }, 100);
      return;
    }

    try {
      const response = await fetch("/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locationId, address, locationName }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      onAddLocation(data);

      const newNotification = {
        id: Date.now(),
        type: "Success",
        message: "Location added.",
      };

      setNotifications((prevNotifications) => [
        ...prevNotifications,
        newNotification,
      ]);

      // Reset form fields
      setLocationId("");
      setAddress("");
      setLocationName("");

      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.error("Error adding location:", error);
      const newNotification = {
        id: Date.now(),
        type: "Error",
        message: "Failed to add location.",
      };

      setNotifications((prevNotifications) => [
        ...prevNotifications,
        newNotification,
      ]);
    }
  };

  const handleCloseNotification = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  };

  //Automatically remove notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      setTimeout(() => {
        setNotifications((prevNotifications) => prevNotifications.slice(1));
      }, 5000);
      return; // Cleanup timer
    }
  }, [notifications]);

  return (
    <>
      {isOpen && (
        <div className="modal fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Add New Location</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">
                  Location ID:
                </label>
                <input
                  type="text"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Address:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Location Name:
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Location
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div>
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`notification ${notification.type}`}
              style={{
                bottom: `${320 + index}px`,
                right: "20px",
                position: "absolute",
                transform: `translateY(${index * 65}px)`,
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
      )}
    </>
  );
};

export default AddLocationModal;
