import React, { useState, useEffect, useRef } from "react";

const AdPreview = ({ ad }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Update the scale based on the container size
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && ad) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;

        // Find the maximum x and y coordinates of the media items
        const maxX = Math.max(
          ...ad.mediaItems.map((item) => item.metadata.x + item.metadata.width)
        );
        const maxY = Math.max(
          ...ad.mediaItems.map((item) => item.metadata.y + item.metadata.height)
        );

        // Calculate the required scaling to fit all media items within the container
        const scaleX = containerWidth / maxX;
        const scaleY = containerHeight / maxY;

        // Use the smaller scale to ensure everything fits
        setScale(Math.min(scaleX, scaleY));
      }
    };

    updateScale(); // Initial scale calculation
    window.addEventListener("resize", updateScale); // Update on resize

    return () => {
      window.removeEventListener("resize", updateScale); // Cleanup listener
    };
  }, [ad]);

  if (!ad) {
    return <div>No ad selected</div>;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {ad.mediaItems.map((mediaItem) => {
        const { x, y, width, height } = mediaItem.metadata;

        // Apply scaling to the media item's position and dimensions
        const scaledX = x * scale;
        const scaledY = y * scale;
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        return (
          <div
            key={mediaItem.id}
            style={{
              position: "absolute",
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
            }}
          >
            {mediaItem.type === "video" ? (
              <video
                src={mediaItem.url}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                controls={false}
                muted
                autoPlay
                loop
              />
            ) : (
              <img
                src={mediaItem.url}
                alt={`${ad.adTitle} - ${mediaItem.id}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdPreview;
