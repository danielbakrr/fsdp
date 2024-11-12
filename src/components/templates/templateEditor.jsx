import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Rect, Circle, IText, FabricImage } from 'fabric';
import { useNavigate } from 'react-router-dom';
import './templateEditor.css';
import { FaImage, FaVideo, FaSquare, FaCircle, FaFont, FaSave } from 'react-icons/fa';

const TemplateEditor = () => {
  const canvasRef = useRef(null);
  const canvas = useRef(null);
  const navigate = useNavigate();
  const [selectedObject, setSelectedObject] = useState(null); 
  const [showTools, setShowTools] = useState(false); 
  const [width, setWidth] = useState(0); 
  const [height, setHeight] = useState(0); 

  // Initialize Fabric.js Canvas
  useEffect(() => {
    if (canvasRef.current) {
      canvas.current = new Canvas(canvasRef.current);
      canvas.current.setWidth(700);
      canvas.current.setHeight(450);

      canvas.current.on('object:selected', (e) => {
        setSelectedObject(e.target); 
        setShowTools(true); 

        // Set initial width and height for the selected object
        if (e.target) {
          setWidth(e.target.width || 0);
          setHeight(e.target.height || 0);
        }
      });

      canvas.current.on('selection:cleared', () => {
        setSelectedObject(null); 
        setShowTools(false); 
      });
    }

    return () => {
      if (canvas.current) {
        canvas.current.dispose();
      }
    };
  }, []);

  // Add a Rectangle
  const addRectangle = () => {
    const rect = new Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 100,
      fill: 'red',
      hasControls: true, 
      lockScalingFlip: true,
    });
    canvas.current.add(rect);
    console.log('Rectangle added');
  };

  // Add a Circle
  const addCircle = () => {
    const circle = new Circle({
      left: 250,
      top: 250,
      radius: 50,
      fill: 'blue',
      hasControls: true,
      lockScalingFlip: true,
    });
    canvas.current.add(circle);
  };

  // Add Editable Text
  const addText = () => {
    const text = new IText('Editable Text', {
      left: 400,
      top: 100,
      fontSize: 30,
      fontFamily: 'Arial',
      fill: 'black',
      hasControls: true,
    });
    canvas.current.add(text);
  };

  // Add image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
  
      reader.onload = (readerEvent) => {
        const img = new Image();
        
        img.onload = () => {
          const fabricImage = new FabricImage(img, {
            left: 100,
            top: 100,
            angle: 0,
            opacity: 1,
          });
          canvas.current.add(fabricImage);
        };
  
        img.onerror = (err) => {
          console.error("Error loading image: ", err);
        };
  
        img.src = readerEvent.target.result;
      };
  
      reader.onerror = (err) => {
        console.error("Error reading file: ", err);
      };
  
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
  
      reader.onload = (readerEvent) => {
        const video = document.createElement('video');
        video.src = readerEvent.target.result;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
  
        video.addEventListener('loadeddata', () => {
          console.log('Video loaded successfully');
  
          const aspectRatio = video.videoWidth / video.videoHeight;
  
          const canvasWidth = canvas.current.width;
          const canvasHeight = canvas.current.height;
  
          let videoWidth = canvasWidth * 0.5; 
          let videoHeight = videoWidth / aspectRatio;  
  
          if (videoHeight > canvasHeight * 0.5) {
            videoHeight = canvasHeight * 0.5;
            videoWidth = videoHeight * aspectRatio;
          }

          const fabricVideo = new FabricImage(video, {
            left: (canvasWidth - videoWidth) / 2,  
            top: (canvasHeight - videoHeight) / 2, 
            width: videoWidth,
            height: videoHeight,
            objectCaching: false,  
            hasControls: true,    
            selectable: true,    
          });
  
          canvas.current.add(fabricVideo);
  
          video.play();
  
          const renderVideoFrame = () => {
            if (fabricVideo) {
              fabricVideo.set({ width: videoWidth, height: videoHeight });
              fabricVideo.setCoords();
              canvas.current.renderAll(); 
  
              requestAnimationFrame(renderVideoFrame);
            }
          };
  
           renderVideoFrame();
  
           fabricVideo.on('moving', function () {
             video.style.left = fabricVideo.left + 'px';
            video.style.top = fabricVideo.top + 'px';
          });
  
           fabricVideo.on('scaling', function () {
            const { width, height } = fabricVideo;
            video.width = width;   
            video.height = height;  
          });
          
           fabricVideo.render = function (ctx) {
            ctx.clearRect(0, 0, fabricVideo.width, fabricVideo.height);  
            ctx.drawImage(video, 0, 0, fabricVideo.width, fabricVideo.height); 
          };
  
          fabricVideo.setCoords();
          canvas.current.renderAll();
        });
  
         video.onerror = (err) => {
          console.error('Error loading video:', err);
        };
        
      };
  
      reader.onerror = (err) => {
        console.error('Error reading video file:', err);
      };
  
      reader.readAsDataURL(file);
    } else {
      console.error('No file selected or file is invalid.');
    }
  };
  
  // save template functionality
  const handleSaveTemplate = () => {
    const templateData = canvas.current.toJSON();
    console.log('Template Data:', templateData); 
  };

  // back to Admin button
  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  // Change Width
  const changeWidth = (newWidth) => {
    if (selectedObject) {
      selectedObject.set({ width: newWidth });
      setWidth(newWidth);
      canvas.current.renderAll();
    }
  };

  // Change Height
  const changeHeight = (newHeight) => {
    if (selectedObject) {
      selectedObject.set({ height: newHeight });
      setHeight(newHeight);
      canvas.current.renderAll();
    }
  };

  // Change shape color
  const changeShapeColor = (color) => {
    if (selectedObject) {
      selectedObject.set({ fill: color });
      canvas.current.renderAll();
    }
  };

  // Change the font of the selected text
  const changeTextFont = (newFont) => {
    if (selectedObject && selectedObject.type === 'i-text') {
      selectedObject.set({ fontFamily: newFont });
      canvas.current.renderAll();
    }
  };

  // Change the color of the selected text
  const changeTextColor = (newColor) => {
    if (selectedObject && selectedObject.type === 'i-text') {
      selectedObject.set({ fill: newColor });
      canvas.current.renderAll();
    }
  };

  // Change the font size of the selected text
  const changeTextSize = (newSize) => {
    if (selectedObject && selectedObject.type === 'i-text') {
      selectedObject.set({ fontSize: newSize });
      canvas.current.renderAll();
    }
  };

  return (
    <div className="template-editor-container">
      <div className="sidebar">
        <div className="sidebar-item" onClick={addRectangle}>
          <FaSquare size={20} />
        </div>
        <div className="sidebar-item" onClick={addCircle}>
          <FaCircle size={20} />
        </div>
        <div className="sidebar-item" onClick={addText}>
          <FaFont size={20} />
        </div>
        <div className="sidebar-item">
          <label htmlFor="image-upload">
            <FaImage size={20} />
          </label>
          <input 
            id="image-upload" 
            type="file" 
            onChange={handleImageUpload} 
            accept="image/*" 
            style={{ display: 'none' }}
          />
        </div>
        <div className="sidebar-item">
          <label htmlFor="video-upload">
            <FaVideo size={20} />
          </label>
          <input 
            id="video-upload" 
            type="file" 
            onChange={handleVideoUpload} 
            accept="video/*" 
            style={{ display: 'none' }}
          />
        </div>
        <div className="sidebar-item" onClick={handleSaveTemplate}>
          <FaSave size={20} />
        </div>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <button className="back-btn" onClick={handleBackToAdmin}>Back to Admin</button>
          <h2 className="editor-title">Template Editor</h2>
        </div>

        <canvas ref={canvasRef} style={{ border: '1px solid #000', marginLeft: 'auto', marginRight: 'auto', display: 'block' }}></canvas>

        {/* Render tools only if an object is selected */}
        {showTools && selectedObject && (
          <div className="tools">
            {/* If the selected object is text */}
            {selectedObject.type === 'i-text' && (
              <>
                <select onChange={(e) => changeTextFont(e.target.value)}>
                  <option value="Arial">Arial</option>
                  <option value="Courier">Courier</option>
                  <option value="Times New Roman">Times New Roman</option>
                </select>
                <input
                  type="color"
                  onChange={(e) => changeTextColor(e.target.value)}
                  title="Text Color"
                />
                <input
                  type="number"
                  value={selectedObject.fontSize}
                  placeholder="Font Size"
                  onChange={(e) => changeTextSize(Number(e.target.value))}
                />
              </>
            )}

            {/* If the selected object is not text (i.e., shape or image) */}
            {selectedObject.type !== 'i-text' && (
              <>
                <input
                  type="number"
                  value={width}
                  placeholder="Width"
                  onChange={(e) => changeWidth(Number(e.target.value))}
                />
                <input
                  type="number"
                  value={height}
                  placeholder="Height"
                  onChange={(e) => changeHeight(Number(e.target.value))}
                />
                <input
                  type="color"
                  onChange={(e) => changeShapeColor(e.target.value)}
                  title="Shape Color"
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateEditor;
