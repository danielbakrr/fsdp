import React, { useEffect, useState, useRef } from "react";
import { ChevronRight, ChevronLeft } from 'lucide-react';
import "../styles/AdForm.css";
import Navbar from "./navbar";
import { jwtDecode } from 'jwt-decode';
const AdList = () => {
  const [ads, setAds] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [fullscreenAd, setFullscreenAd] = useState(null);
  const [draggingItem, setDraggingItem] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingItem, setResizingItem] = useState(null);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const wsClient = useRef(null);
  const [userFeatures, setUserFeatures] = useState([]);
  const features = ["Tv Groups", "Template Editor", "Advertisement Management", "User Management", "Metrics", "Schedule Ads"];

  const decodeToken = () => {
    const token = localStorage.getItem('token');
    if (token != null) {
      const decodedToken = jwtDecode(token);
      const role = decodedToken.permissions;
      const temp = [];
      const permissions = role.permissions;
      if (Array.isArray(permissions) && permissions.length > 0) {
        permissions.forEach(element => {
          for (let i = 0; i < features.length; i++) {
            if (features[i].includes(element.resource)) {
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
      const response = await fetch('https://githubbiesbackend.onrender.com/api/Advertisements');
      const data = await response.json();
      setAds(data);
      if (data.length > 0) setActiveTab(data[0].adID);
    };
    fetchAds();
  }, []);

  const sendUpdate = (ad) => {
    if (wsClient.current && wsClient.current.send) {
      wsClient.current.send({ type: "ad_update", ad });
    } else {
      console.error("WebSocket client is not initialized or send function is missing.");
    }
  };

  const deleteAd = async (adID) => {
    await fetch(`https://githubbiesbackend.onrender.com/api/delete/${adID}`, {
      method: "DELETE",
    });
    setAds(ads.filter((ad) => ad.adID !== adID));
    if (activeTab === adID) {
      const remainingAds = ads.filter((ad) => ad.adID !== adID);
      setActiveTab(remainingAds.length > 0 ? remainingAds[0].adID : null);
    }
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
          const response = await fetch('https://githubbiesbackend.onrender.com/api/update-coordinates', {
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
    <div className="editor-wrapper">
      <Navbar navItems={userFeatures} />
      <div 
        className="editor-container" 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp}
      >
        {/* Canvas Area */}
        <div className="w-full h-full p-4">
          {ads.map((ad) =>
            ad.adID === activeTab ? (
              <div 
                key={ad.adID} 
                className="relative w-full h-full"
              >
                <div
                  style={{
                    padding: "20px",
                    border: "1px solid #ddd",
                    minHeight: "700px",
                    position: "relative",
                    backgroundColor: "white",
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

        {/* Overlapping Sidebar */}
        <div 
          className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            zIndex: 1000,
          }}
        >
          <div className="sidebar-content">
            <h2 className="text-xl font-bold mb-4">Advertisement List</h2>
            
            {/* Ad buttons with reduced margin and compact layout */}
            <div className="flex flex-col gap-1">
              {ads.map((ad) => (
                <button
                  key={ad.adID}
                  onClick={() => handleTabClick(ad.adID)}
                  className={`w-full p-2 text-left rounded ${
                    activeTab === ad.adID 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {ad.adTitle}
                </button>
              ))}
              
              {/* Delete button directly after ad buttons with minimal gap */}
              {activeTab && (
                <button
                  onClick={() => deleteAd(activeTab)}
                  className="w-full p-2 rounded text-white"
                  style={{ backgroundColor: '#ff0000',
                    marginBottom: '5em',
                   }}
                >
                  Delete Advertisement
                </button>
              )}
            </div>
          </div>
          
          <button 
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <ChevronLeft size={32} /> : <ChevronRight size={32} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdList;