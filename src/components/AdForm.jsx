import React, { useState, useRef } from 'react';
import '../styles/AdForm.css';

const AdForm = () => {
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [adTitle, setAdTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mediaPosition, setMediaPosition] = useState({ x: 200, y: 200 });
  const [mediaSize, setMediaSize] = useState({ width: 200, height: 200 });
  const [resizing, setResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const mediaRef = useRef(null);

  const handleMediaUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setMedia(e.target.result);
                setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
            };
            reader.readAsDataURL(file);
        }
    };

  const handleMouseDown = (e) => {
    if (e.target.classList.contains('resize-handle')) {
      setResizing(true);
      setResizeDirection(e.target.dataset.direction);
    } else {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - mediaPosition.x,
        y: e.clientY - mediaPosition.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setMediaPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    } else if (resizing && resizeDirection) {
      const deltaX = e.clientX - mediaPosition.x;
      const deltaY = e.clientY - mediaPosition.y;

      let newWidth = mediaSize.width;
      let newHeight = mediaSize.height;

      if (resizeDirection.includes('right')) newWidth = deltaX;
      if (resizeDirection.includes('bottom')) newHeight = deltaY;
      if (resizeDirection.includes('left')) {
        newWidth = mediaSize.width - (e.movementX);
        setMediaPosition((prev) => ({ ...prev, x: prev.x + e.movementX }));
      }
      if (resizeDirection.includes('top')) {
        newHeight = mediaSize.height - (e.movementY);
        setMediaPosition((prev) => ({ ...prev, y: prev.y + e.movementY }));
      }

      setMediaSize({
        width: Math.max(newWidth, 50),
        height: Math.max(newHeight, 50),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizing(false);
    setResizeDirection(null);
  };

  const handleSave = async () => {
    if (!media || !adTitle) {
        alert('Please upload a media file and provide an ad title.');
        return;
    }

    const formData = new FormData();
    formData.append('media', dataURLtoFile(media, `${adTitle}.${mediaType === 'video' ? 'mp4' : 'png'}`));
    formData.append('adTitle', adTitle);
    formData.append('coordinates', JSON.stringify({
        x: mediaPosition.x,
        y: mediaPosition.y,
        width: mediaSize.width,
        height: mediaSize.height,
    }));

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
  
  // Helper to convert data URL to a File object
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };
  

  const handleDelete = () => {
    setMedia(null);
    setMediaPosition({ x: 100, y: 100 });
    setMediaSize({ width: 200, height: 200 });
    setAdTitle('');
  };

  return (
    <div className="editor-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} />
        <input
            type="text"
            placeholder="Enter Advertisement Title"
            value={adTitle}
            onChange={(e) => setAdTitle(e.target.value)}
        />
        <button onClick={handleSave} disabled={!media}>Save Media</button>
        <button onClick={handleDelete} disabled={!media}>Delete Media</button>
        {media && (
            <div
                className="media-container"
                style={{
                    top: mediaPosition.y,
                    left: mediaPosition.x,
                    width: mediaSize.width,
                    height: mediaSize.height,
                }}
                onMouseDown={handleMouseDown}
                ref={mediaRef}
            >
                {mediaType === 'video' ? (
                    <video
                        src={media}
                        controls
                        style={{ width: '100%', height: '100%' }}
                    />
                ) : (
                    <img src={media} alt="Uploaded" style={{ width: '100%', height: '100%' }} />
                )}
                {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'].map((dir) => (
                    <div
                        key={dir}
                        className={`resize-handle ${dir}`}
                        data-direction={dir}
                    />
                ))}
            </div>
        )}
    </div>
);
};

export default AdForm;
