import React, { useEffect, useState, useRef } from "react";
import "../styles/AdForm.css";
import WebSocketClient from "../websocket/WebsocketClient";

const AdList = () => {
  const [ads, setAds] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [fullscreenAd, setFullscreenAd] = useState(null);
  const [draggingAdID, setDraggingAdID] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingAdID, setResizingAdID] = useState(null);
  const [resizeDirection, setResizeDirection] = useState(null);
  const wsClient = useRef(null);

  useEffect(() => {
    const fetchAds = async () => {
      const response = await fetch("http://localhost:5000/api/Advertisements");
      const data = await response.json();
      setAds(data);
      if (data.length > 0) setActiveTab(data[0].adID);
    };
    fetchAds();

    // Initialize WebSocket client
    wsClient.current = new WebSocketClient("ws://localhost:3000");
    wsClient.current.connect();

    return () => {
      wsClient.current.disconnect();
    };
  }, []);

  const sendUpdate = (ad) => {
    if (wsClient.current && wsClient.current.send) {
      wsClient.current.send({ type: "ad_update", ad });
    } else {
      console.error("WebSocket client is not initialized or send function is missing.");
    }
  };
  
  const deleteAd = async (adID) => {
    await fetch(`http://localhost:5000/api/delete/${adID}`, {
      method: "DELETE",
    });
    setAds(ads.filter((ad) => ad.adID !== adID));
    if (activeTab === adID) setActiveTab(null);
  };

  const handleTabClick = (adID) => {
    setActiveTab(adID);
  };

  const toggleFullscreen = (adID) => {
    setFullscreenAd(fullscreenAd === adID ? null : adID);
  };

  const exitFullscreen = () => {
    setFullscreenAd(null);
  };

  const handleMouseDown = (e, ad, isResize = false, direction = null) => {
    e.stopPropagation();
    if (isResize) {
      setResizingAdID(ad.adID);
      setResizeDirection(direction);
    } else {
      setDraggingAdID(ad.adID);
      setDragOffset({
        x: e.clientX - (ad.metadata?.x || 0),
        y: e.clientY - (ad.metadata?.y || 0),
      });
    }
  };

  const handleMouseMove = (e) => {
    if (draggingAdID) {
      setAds((prevAds) =>
        prevAds.map((ad) =>
          ad.adID === draggingAdID
            ? {
                ...ad,
                metadata: {
                  ...ad.metadata,
                  x: e.clientX - dragOffset.x,
                  y: e.clientY - dragOffset.y,
                },
              }
            : ad
        )
      );
    } else if (resizingAdID && resizeDirection) {
      setAds((prevAds) =>
        prevAds.map((ad) => {
          if (ad.adID !== resizingAdID) return ad;

          const newMetadata = { ...ad.metadata };
          const deltaX = e.movementX;
          const deltaY = e.movementY;

          if (resizeDirection.includes("right"))
            newMetadata.width = Math.max(newMetadata.width + deltaX, 50);
          if (resizeDirection.includes("bottom"))
            newMetadata.height = Math.max(newMetadata.height + deltaY, 50);
          if (resizeDirection.includes("left")) {
            newMetadata.x += deltaX;
            newMetadata.width = Math.max(newMetadata.width - deltaX, 50);
          }
          if (resizeDirection.includes("top")) {
            newMetadata.y += deltaY;
            newMetadata.height = Math.max(newMetadata.height - deltaY, 50);
          }

          return { ...ad, metadata: newMetadata };
        })
      );
    }
  };

  const handleMouseUp = async () => {
    if (draggingAdID || resizingAdID) {
      setDraggingAdID(null);
      setResizingAdID(null);
      setResizeDirection(null);

      const adToUpdate = ads.find(
        (ad) => ad.adID === (draggingAdID || resizingAdID)
      );
      if (adToUpdate) {
        sendUpdate(adToUpdate);
        try {
          const response = await fetch(
            "http://localhost:5000/api/update-coordinates",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                adID: adToUpdate.adID,
                coordinates: adToUpdate.metadata,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update coordinates");
          }
        } catch (error) {
          console.error("Error updating coordinates:", error);
          alert("Failed to update coordinates");
        }
      }
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ userSelect: "none" }}
    >
      <h2>Advertisements</h2>
      <div style={{ display: "flex", borderBottom: "2px solid #ccc" }}>
        {ads.map((ad) => (
          <button
            key={ad.adID}
            onClick={() => handleTabClick(ad.adID)}
            style={{
              padding: "10px",
              cursor: "pointer",
              borderBottom: activeTab === ad.adID ? "2px solid blue" : "none",
              backgroundColor: activeTab === ad.adID ? "#f0f0f0" : "white",
              fontWeight: activeTab === ad.adID ? "bold" : "normal",
            }}
          >
            {ad.adTitle}
          </button>
        ))}
      </div>

      {ads.map((ad) =>
        ad.adID === activeTab ? (
          <div key={ad.adID} style={{ marginTop: "10px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <h3>{ad.adTitle}</h3>
              <div>
                <button
                  onClick={() => toggleFullscreen(ad.adID)}
                  style={{ padding: "5px 10px", marginRight: "10px" }}
                >
                  {fullscreenAd === ad.adID ? "Exit Fullscreen" : "Fullscreen"}
                </button>
                <button
                  onClick={() => deleteAd(ad.adID)}
                  style={{ padding: "5px 10px" }}
                >
                  Delete
                </button>
              </div>
            </div>

            <div
              style={{
                padding: fullscreenAd === ad.adID ? "0" : "20px",
                border: "1px solid #ddd",
                minHeight: fullscreenAd === ad.adID ? "100vh" : "700px",
                position: fullscreenAd === ad.adID ? "fixed" : "relative",
                top: fullscreenAd === ad.adID ? "0" : "auto",
                left: fullscreenAd === ad.adID ? "0" : "auto",
                width: fullscreenAd === ad.adID ? "100%" : "auto",
                height: fullscreenAd === ad.adID ? "100vh" : "auto",
                backgroundColor: fullscreenAd === ad.adID ? "white" : "white",
                zIndex: fullscreenAd === ad.adID ? "1000" : "1",
                overflow: "hidden",
              }}
            >
              {fullscreenAd === ad.adID && (
                <button
                  onClick={exitFullscreen}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    padding: "5px 10px",
                    zIndex: "1001",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                  }}
                >
                  Exit Fullscreen
                </button>
              )}

              <div
                className="draggable-resizable"
                style={{
                  position: "absolute",
                  left: `${ad.metadata?.x || 0}px`,
                  top: `${ad.metadata?.y || 0}px`,
                  width: `${ad.metadata?.width || 100}px`,
                  height: `${ad.metadata?.height || 100}px`,
                  border: "1px solid #000",
                  overflow: "hidden",
                  cursor: draggingAdID === ad.adID ? "grabbing" : "grab",
                }}
                onMouseDown={(e) => handleMouseDown(e, ad)}
              >
                <img
                  src={ad.mediaUrl}
                  alt={ad.adTitle}
                  style={{
                    width: `${ad.metadata?.width || 100}px`,
                    height: `${ad.metadata?.height || 100}px`,
                    objectFit: "cover",
                  }}
                />

                {[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                  "top",
                  "bottom",
                  "left",
                  "right",
                ].map((dir) => (
                  <div
                    key={dir}
                    className={`resize-handle ${dir}`}
                    data-direction={dir}
                    onMouseDown={(e) => handleMouseDown(e, ad, true, dir)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null
      )}
    </div>
  );
};

export default AdList;
