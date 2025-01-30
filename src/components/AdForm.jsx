import React, { useState, useRef } from 'react';
import '../styles/ImageEditor.css';

const ImageEditor = () => {
  const [image, setImage] = useState(null);
  const [adTitle, setAdTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 200, y: 200 });
  const [imageSize, setImageSize] = useState({ width: 200, height: 200 });
  const [resizing, setResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const imageRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
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
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setImagePosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    } else if (resizing && resizeDirection) {
      const deltaX = e.clientX - imagePosition.x;
      const deltaY = e.clientY - imagePosition.y;

      let newWidth = imageSize.width;
      let newHeight = imageSize.height;

      if (resizeDirection.includes('right')) newWidth = deltaX;
      if (resizeDirection.includes('bottom')) newHeight = deltaY;
      if (resizeDirection.includes('left')) {
        newWidth = imageSize.width - (e.movementX);
        setImagePosition((prev) => ({ ...prev, x: prev.x + e.movementX }));
      }
      if (resizeDirection.includes('top')) {
        newHeight = imageSize.height - (e.movementY);
        setImagePosition((prev) => ({ ...prev, y: prev.y + e.movementY }));
      }

      setImageSize({
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
    if (!image || !adTitle) {
      alert('Please upload an image and provide an ad title.');
      return;
    }
  
    const formData = new FormData();
    formData.append('image', dataURLtoFile(image, `${adTitle}.png`));
    formData.append('adTitle', adTitle);
    formData.append('coordinates', JSON.stringify({
      x: imagePosition.x,
      y: imagePosition.y,
      width: imageSize.width,
      height: imageSize.height,
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
    setImage(null);
    setImagePosition({ x: 100, y: 100 });
    setImageSize({ width: 200, height: 200 });
    setAdTitle('');
  };

  return (
    <div
      className="editor-container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <input type="file" onChange={handleImageUpload} />
      <input
        type="text"
        placeholder="Enter Advertisement Title"
        value={adTitle}
        onChange={(e) => setAdTitle(e.target.value)}
      />
      <button onClick={handleSave} disabled={!image}>Save Image</button>
      <button onClick={handleDelete} disabled={!image}>Delete Image</button>
      {image && (
        <div
          className="image-container"
          style={{
            top: imagePosition.y,
            left: imagePosition.x,
            width: imageSize.width,
            height: imageSize.height,
          }}
          onMouseDown={handleMouseDown}
          ref={imageRef}
        >
          <img src={image} alt="Uploaded" style={{ width: '100%', height: '100%' }} />
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

export default ImageEditor;
