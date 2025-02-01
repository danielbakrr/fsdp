import React, { useState, useEffect } from "react";
import AlertMessage from "../successMessage";

const UpdateGroupModal = ({ groupID, isOpen, onClose, onUpdateGroup }) => {
  const [newGroupName, setNewGroupName] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newGroupName) {
      const newNotification = {
        id: Date.now(),
        type: "Error",
        message: "Please fill in the fields.",
      };

      setNotifications((prevNotifications) => [
        ...prevNotifications,
        newNotification,
      ]);

      setNewGroupName("");
      setTimeout(() => onClose(), 100);
      return;
    }

    setIsLoading(true); // Set loading state

    try {
      const response = await fetch(`/tvgroups/${groupID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newGroupName }),
      });

      const textResponse = await response.text();
      const data = JSON.parse(textResponse);

      if (data.error) {
        throw new Error(data.error);
      }

      onUpdateGroup(data);

      const newNotification = {
        id: Date.now(),
        type: "Success",
        message: "Group name updated.",
      };

      setNotifications((prevNotifications) => [
        ...prevNotifications,
        newNotification,
      ]);

      setNewGroupName("");
      setTimeout(() => onClose(), 100);
    } catch (error) {
      console.error("Error updating group:", error);
      const newNotification = {
        id: Date.now(),
        type: "Error",
        message: "Failed to update group.",
      };

      setNotifications((prevNotifications) => [
        ...prevNotifications,
        newNotification,
      ]);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  const handleCloseNotification = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  };

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications((prevNotifications) => prevNotifications.slice(1));
      }, 5000);

      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [notifications]);

  return (
    <>
      {isOpen && (
        <div className="modal fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content bg-white rounded-lg shadow-lg p-6 w-96">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="newGroupName"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Group Name
                </label>
                <input
                  type="text"
                  id="newGroupName"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter new group name"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  disabled={isLoading} // Disable button while loading
                >
                  {isLoading ? "Saving..." : "Save"}
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
      )}
    </>
  );
};

export default UpdateGroupModal;
