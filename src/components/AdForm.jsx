import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import '../styles/AdForm.css';
import Navbar from './navbar';

const AdForm = () => {
  const [mediaItems, setMediaItems] = useState([]);
  const [adTitle, setAdTitle] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newMediaItem = {
          id: Date.now() + Math.random(), // Unique ID for each media item
          file: file,
          preview: e.target.result,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          position: { x: 200, y: 200 },
          size: { width: 200, height: 200 }
        };
        setMediaItems(prev => [...prev, newMediaItem]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMouseDown = (e, itemId) => {
    e.stopPropagation();
    setSelectedItemId(itemId);
    
    if (e.target.classList.contains('resize-handle')) {
      setResizing(true);
      setResizeDirection(e.target.dataset.direction);
    } else {
      setIsDragging(true);
      const item = mediaItems.find(item => item.id === itemId);
      setDragOffset({
        x: e.clientX - item.position.x,
        y: e.clientY - item.position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!selectedItemId) return;

    if (isDragging) {
      setMediaItems(prev => prev.map(item => {
        if (item.id === selectedItemId) {
          return {
            ...item,
            position: {
              x: e.clientX - dragOffset.x,
              y: e.clientY - dragOffset.y,
            }
          };
        }
        return item;
      }));
    } else if (resizing && resizeDirection) {
      setMediaItems(prev => prev.map(item => {
        if (item.id === selectedItemId) {
          const deltaX = e.clientX - item.position.x;
          const deltaY = e.clientY - item.position.y;
          let newWidth = item.size.width;
          let newHeight = item.size.height;
          let newX = item.position.x;
          let newY = item.position.y;

          if (resizeDirection.includes('right')) newWidth = deltaX;
          if (resizeDirection.includes('bottom')) newHeight = deltaY;
          if (resizeDirection.includes('left')) {
            newWidth = item.size.width - (e.movementX);
            newX = item.position.x + e.movementX;
          }
          if (resizeDirection.includes('top')) {
            newHeight = item.size.height - (e.movementY);
            newY = item.position.y + e.movementY;
          }

          return {
            ...item,
            position: { x: newX, y: newY },
            size: {
              width: Math.max(newWidth, 50),
              height: Math.max(newHeight, 50),
            }
          };
        }
        return item;
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizing(false);
    setResizeDirection(null);
    setSelectedItemId(null);
  };

  const handleSave = async () => {
    if (mediaItems.length === 0 || !adTitle) {
      alert('Please upload at least one media file and provide an ad title.');
      return;
    }

    const formData = new FormData();
    formData.append('adTitle', adTitle);

    // Add all media files and their metadata
    mediaItems.forEach((item, index) => {
      formData.append(`media_${index}`, item.file);
      formData.append(`metadata_${index}`, JSON.stringify({
        id: item.id,
        type: item.type,
        x: item.position.x,
        y: item.position.y,
        width: item.size.width,
        height: item.size.height
      }));
    });

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert('Ad uploaded successfully!');
        handleDelete();
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error uploading ad:', error);
      alert('An error occurred while uploading the ad.');
    }
  };

  const handleDelete = (itemId = null) => {
    if (itemId) {
      setMediaItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setMediaItems([]);
      setAdTitle('');
    }
  };

  return (
    <div className="editor-wrapper">
      <Navbar />
      <div className="editor-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {/* Sidebar */}
        <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-content">
            <h2 className="text-xl font-bold mb-4">Ad Controls</h2>
            
            <div className="control-group">
              <label className="block mb-2">Upload Media</label>
              <input 
                type="file" 
                multiple 
                accept="image/*,video/*" 
                onChange={handleMediaUpload}
                className="w-full mb-4" 
              />
            </div>
            
            <div className="control-group">
              <label className="block mb-2">Advertisement Title</label>
              <input
                type="text"
                placeholder="Enter title"
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                className="w-full p-2 mb-4 border rounded"
              />
            </div>
            
            <div className="control-group">
              <button 
                onClick={handleSave} 
                disabled={mediaItems.length === 0}
                className="w-full bg-blue-500 text-white p-2 rounded mb-2 disabled:bg-gray-300"
              >
                Save Advertisement
              </button>
              
              <button 
                onClick={() => handleDelete()} 
                disabled={mediaItems.length === 0}
                className="w-full bg-red-500 text-white p-2 rounded disabled:bg-gray-300"
              >
                Delete All
              </button>
            </div>
          </div>
          
          <button 
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>

        {/* Media Items */}
        {mediaItems.map((item) => (
          <div
            key={item.id}
            className="media-container"
            style={{
              position: 'absolute',
              top: item.position.y,
              left: item.position.x,
              width: item.size.width,
              height: item.size.height,
              border: selectedItemId === item.id ? '2px solid blue' : '1px solid #ccc'
            }}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            {item.type === 'video' ? (
              <video
                src={item.preview}
                controls
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <img src={item.preview} alt="Uploaded" style={{ width: '100%', height: '100%' }} />
            )}
            <button 
              className="delete-button"
              onClick={() => handleDelete(item.id)}
            >
              ×
            </button>
            {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'].map((dir) => (
              <div
                key={dir}
                className={`resize-handle ${dir}`}
                data-direction={dir}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdForm;