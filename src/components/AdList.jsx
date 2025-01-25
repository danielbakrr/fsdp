import React, { useEffect, useState } from 'react';
import '../styles/ImageEditor.css';

const AdList = () => {
  const [files, setAds] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [fullscreenAd, setFullscreenAd] = useState(null);

  useEffect(() => {
    const fetchAds = async () => {
      const response = await fetch('http://localhost:5000/api/files');
      const data = await response.json();
      setAds(data);
      if (data.length > 0) setActiveTab(data[0].FileId);
    };
    fetchAds();
  }, []);

  const deleteAd = async (FileId) => {
    await fetch(`http://localhost:5000/api/delete/${FileId}`, { method: 'DELETE' });
    setAds(files.filter((ad) => ad.FileId !== FileId));
    if (activeTab === FileId) setActiveTab(null);
  };

  const handleTabClick = (FileId) => {
    setActiveTab(FileId);
  };

  const toggleFullscreen = (FileId) => {
    setFullscreenAd(fullscreenAd === FileId ? null : FileId);
  };

  const exitFullscreen = () => {
    setFullscreenAd(null);
  };

  const handleDragEnd = async (event, ad) => {
    const containerRect = event.target.parentNode.getBoundingClientRect();
    const { clientX, clientY } = event;

    // Update position
    const coordinates = {
        x: (clientX - containerRect.left)/3,
        y: (clientY - containerRect.top)/3,
        width: ad.metadata?.width || event.target.offsetWidth,
        height: ad.metadata?.height || event.target.offsetHeight,
    };

    try {
        const response = await fetch('http://localhost:5000/api/update-coordinates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ FileId: ad.FileId, coordinates }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update coordinates');
        }

        setAds(files.map((item) =>
            item.FileId === ad.FileId ? { ...item, metadata: coordinates } : item
        ));
    } catch (error) {
        console.error('Error updating coordinates:', error);
        alert('Failed to update coordinates');
    }
};

const handleResizeEnd = async (ad, newSize) => {
  const coordinates = {
    x: ad.metadata?.x || 0,
    y: ad.metadata?.y || 0,
    width: newSize.width,
    height: newSize.height,
  };

  try {
    const response = await fetch('http://localhost:5000/api/update-coordinates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ FileId: ad.FileId, coordinates }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update size');
    }

    setAds(files.map((item) =>
      item.FileId === ad.FileId ? { ...item, metadata: coordinates } : item
    ));
  } catch (error) {
    console.error('Error updating size:', error);
    alert('Failed to update size');
  }
};



return (
  <div>
    <h2>Ads</h2>
    <div style={{ display: 'flex', borderBottom: '2px solid #ccc' }}>
      {files.map((ad) => (
        <button
          key={ad.FileId}
          onClick={() => handleTabClick(ad.FileId)}
          style={{
            padding: '10px',
            cursor: 'pointer',
            borderBottom: activeTab === ad.FileId ? '2px solid blue' : 'none',
            backgroundColor: activeTab === ad.FileId ? '#f0f0f0' : 'white',
            fontWeight: activeTab === ad.FileId ? 'bold' : 'normal',
          }}
        >
          {ad.FileName}
        </button>
      ))}
    </div>

    {files.map((ad) =>
      ad.FileId === activeTab ? (
        <div key={ad.FileId} style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3>{ad.FileId}</h3>
            <div>
              <button onClick={() => toggleFullscreen(ad.FileId)} style={{ padding: '5px 10px', marginRight: '10px' }}>
                {fullscreenAd === ad.FileId ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
              <button onClick={() => deleteAd(ad.FileId)} style={{ padding: '5px 10px' }}>Delete</button>
            </div>
          </div>

          <div
            style={{
              padding: fullscreenAd === ad.FileId ? '0' : '20px',
              border: '1px solid #ddd',
              minHeight: fullscreenAd === ad.FileId ? '100vh' : '700px',
              position: fullscreenAd === ad.FileId ? 'fixed' : 'relative',
              top: fullscreenAd === ad.FileId ? '0' : 'auto',
              left: fullscreenAd === ad.FileId ? '0' : 'auto',
              width: fullscreenAd === ad.FileId ? '100%' : 'auto',
              height: fullscreenAd === ad.FileId ? '100vh' : 'auto',
              backgroundColor: fullscreenAd === ad.FileId ? 'white' : 'white',
              zIndex: fullscreenAd === ad.FileId ? '1000' : '1',
              overflow: 'hidden',
            }}
          >
            {fullscreenAd === ad.FileId && (
              <button
                onClick={exitFullscreen}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '5px 10px',
                  zIndex: '1001',
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                }}
              >
                Exit Fullscreen
              </button>
            )}

            <div
              style={{
                position: 'absolute',
                left: `${ad.metadata?.x}px`,
                top: `${ad.metadata?.y}px`,
                width: `${ad.metadata?.width}px`,
                height: `${ad.metadata?.height}px`,
                border: '1px solid #000',
                resize: 'both',
                overflow: 'hidden',
              }}
              onMouseUp={(event) => {
                const newSize = {
                  width: event.target.offsetWidth,
                  height: event.target.offsetHeight,
                };
                handleResizeEnd(ad, newSize);
              }}
            >
              <img
                src={ad.FileUrl}
                alt={ad.FileName}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                draggable
                onDragEnd={(event) => handleDragEnd(event, ad)}
              />
            </div>
          </div>
        </div>
      ) : null
    )}
  </div>
  );
};

export default AdList;
