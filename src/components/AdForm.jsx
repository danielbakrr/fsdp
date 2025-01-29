import React, { useState, useRef } from 'react';
import '../styles/ImageEditor.css';

const ImageEditor = () => {
  const [media, setMedia] = useState([]); // Store multiple media files
  const [adTitle, setAdTitle] = useState('');
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingIndex, setResizingIndex] = useState(null);
  const imageRefs = useRef([]); // References for each media item for resizing

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    const mediaData = files.map((file) => {
      return {
        url: URL.createObjectURL(file),
        type: file.type.startsWith('image') ? 'image' : 'video',
        file,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 200 },
      };
    });
    setMedia([...media, ...mediaData]);
  };

  const handleSave = async () => {
    if (media.length === 0 || !adTitle) {
      alert('Please upload media and provide an ad title.');
      return;
    }

    const formData = new FormData();
    media.forEach((item) => formData.append('mediaFiles', item.file));
    formData.append('adTitle', adTitle);
    formData.append('coordinates', JSON.stringify(
      media.map((item) => ({
        x: item.position.x,
        y: item.position.y,
        width: item.size.width,
        height: item.size.height,
      }))
    ));

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

  const handleDelete = () => {
    setMedia([]);
    setAdTitle('');
  };

  const handleDragStart = (index, e) => {
    setDraggingIndex(index);
    setDragOffset({ x: e.clientX, y: e.clientY });
  };

  const handleDragMove = (e) => {
    if (draggingIndex !== null) {
      const deltaX = e.clientX - dragOffset.x;
      const deltaY = e.clientY - dragOffset.y;
      setDragOffset({ x: e.clientX, y: e.clientY });

      setMedia((prevMedia) => {
        const updatedMedia = [...prevMedia];
        updatedMedia[draggingIndex].position.x += deltaX;
        updatedMedia[draggingIndex].position.y += deltaY;
        return updatedMedia;
      });
    }
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  const handleResizeStart = (index, e) => {
    setResizingIndex(index);
    e.stopPropagation();
  };

  const handleResizeMove = (e) => {
    if (resizingIndex !== null) {
      setMedia((prevMedia) => {
        const updatedMedia = [...prevMedia];
        const mediaItem = updatedMedia[resizingIndex];
        mediaItem.size = {
          width: Math.max(mediaItem.size.width + e.movementX, 50),
          height: Math.max(mediaItem.size.height + e.movementY, 50),
        };
        return updatedMedia;
      });
    }
  };

  const handleResizeEnd = () => {
    setResizingIndex(null);
  };

  return (
    <div
      className="editor-container"
      onMouseMove={(e) => { handleDragMove(e); handleResizeMove(e); }}
      onMouseUp={() => { handleDragEnd(); handleResizeEnd(); }}
      onMouseLeave={() => { handleDragEnd(); handleResizeEnd(); }}
    >
      <input type="file" multiple onChange={handleMediaUpload} />
      <input
        type="text"
        placeholder="Enter Advertisement Title"
        value={adTitle}
        onChange={(e) => setAdTitle(e.target.value)}
      />
      <button onClick={handleSave} disabled={media.length === 0}>Save Advertisement</button>
      <button onClick={handleDelete} disabled={media.length === 0}>Delete All Media</button>
      {media.map((item, index) => (
        <div
          key={index}
          className="media-container"
          style={{
            top: item.position.y,
            left: item.position.x,
            width: item.size.width,
            height: item.size.height,
            position: 'absolute',
          }}
          onMouseDown={(e) => handleDragStart(index, e)}
        >
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={`Media ${index}`}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <video controls style={{ width: '100%', height: '100%' }}>
              <source src={item.url} type={item.file.type} />
              Your browser does not support the video tag.
            </video>
          )}
          <div
            className="resize-handle"
            onMouseDown={(e) => handleResizeStart(index, e)}
          />
        </div>
      ))}
    </div>
  );
};

export default ImageEditor;
