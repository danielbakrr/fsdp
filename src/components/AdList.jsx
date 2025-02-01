import React, { useEffect, useState, useRef } from "react";
import "../styles/AdForm.css";
import Navbar from "./navbar";
import WebSocketClient from "../websocket/WebsocketClient";
import { jwtDecode } from 'jwt-decode';
const AdList = () => {
  const [ads, setAds] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [fullscreenAd, setFullscreenAd] = useState(null);
  const [draggingItem, setDraggingItem] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingItem, setResizingItem] = useState(null);
  const [resizeDirection, setResizeDirection] = useState(null);
  const wsClient = useRef(null);
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

  useEffect(() => {
    decodeToken();
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

  const handleMouseDown = (e, ad, mediaItem, isResize = false, direction = null) => {
    e.stopPropagation();
    if (isResize) {
      setResizingItem({ adID: ad.adID, mediaID: mediaItem.id });
      setResizeDirection(direction);
    } else {
      setDraggingItem({ adID: ad.adID, mediaID: mediaItem.id });
      setDragOffset({
        x: e.clientX - mediaItem.metadata.x,
        y: e.clientY - mediaItem.metadata.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (draggingItem) {
      setAds((prevAds) =>
        prevAds.map((ad) => {
          if (ad.adID !== draggingItem.adID) return ad;
          
          return {
            ...ad,
            mediaItems: ad.mediaItems.map((item) => {
              if (item.id !== draggingItem.mediaID) return item;
              
              return {
                ...item,
                metadata: {
                  ...item.metadata,
                  x: e.clientX - dragOffset.x,
                  y: e.clientY - dragOffset.y,
                },
              };
            }),
          };
        })
      );
    } else if (resizingItem && resizeDirection) {
      setAds((prevAds) =>
        prevAds.map((ad) => {
          if (ad.adID !== resizingItem.adID) return ad;

          return {
            ...ad,
            mediaItems: ad.mediaItems.map((item) => {
              if (item.id !== resizingItem.mediaID) return item;

              const newMetadata = { ...item.metadata };
              const deltaX = e.movementX;
              const deltaY = e.movementY;

              if (resizeDirection.includes('right')) {
                newMetadata.width = Math.max(newMetadata.width + deltaX, 50);
              }
              if (resizeDirection.includes('bottom')) {
                newMetadata.height = Math.max(newMetadata.height + deltaY, 50);
              }
              if (resizeDirection.includes('left')) {
                newMetadata.x += deltaX;
                newMetadata.width = Math.max(newMetadata.width - deltaX, 50);
              }
              if (resizeDirection.includes('top')) {
                newMetadata.y += deltaY;
                newMetadata.height = Math.max(newMetadata.height - deltaY, 50);
              }

              return {
                ...item,
                metadata: newMetadata,
              };
            }),
          };
        })
      );
    }
  };

  const handleMouseUp = async () => {
    if (draggingItem || resizingItem) {
      const itemToUpdate = draggingItem || resizingItem;
      const adToUpdate = ads.find((ad) => ad.adID === itemToUpdate.adID);
      
      if (adToUpdate) {
        sendUpdate(adToUpdate);
        try {
          const response = await fetch('http://localhost:5000/api/update-coordinates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              adID: adToUpdate.adID,
              coordinates: adToUpdate.mediaItems.reduce((acc, item) => {
                acc[item.id] = item.metadata;
                return acc;
              }, {}),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update coordinates");
          }
        } catch (error) {
          console.error("Error updating coordinates:", error);
          alert("Failed to update coordinates");
        }
      }

      setDraggingItem(null);
      setResizingItem(null);
      setResizeDirection(null);
    }
  };

  return (
    <div>
      <Navbar
        navItems={userFeatures} 
      />
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ userSelect: "none" }}
    >
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
              color: "black",
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
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
                <button onClick={() => deleteAd(ad.adID)} style={{ padding: "5px 10px" }}>
                  Delete Advertisement
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

              {ad.mediaItems && ad.mediaItems.map((mediaItem) => (
                <div
                  key={mediaItem.id}
                  className="draggable-resizable"
                  style={{
                    position: 'absolute',
                    left: `${mediaItem.metadata.x}px`,
                    top: `${mediaItem.metadata.y}px`,
                    width: `${mediaItem.metadata.width}px`,
                    height: `${mediaItem.metadata.height}px`,
                    border: '1px solid #000',
                    overflow: 'hidden',
                    cursor: draggingItem?.mediaID === mediaItem.id ? 'grabbing' : 'grab',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, ad, mediaItem)}
                >
                  {mediaItem.type === 'video' ? (
                    <video
                      src={mediaItem.url}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      controls
                    />
                  ) : (
                    <img
                      src={mediaItem.url}
                      alt={`${ad.adTitle} - ${mediaItem.id}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  )}

                  {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'].map((dir) => (
                    <div
                      key={dir}
                      className={`resize-handle ${dir}`}
                      data-direction={dir}
                      onMouseDown={(e) => handleMouseDown(e, ad, mediaItem, true, dir)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
    </div>
  );
};

export default AdList;
