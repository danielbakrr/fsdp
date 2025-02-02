import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl";
import Webcam from "react-webcam";
import { drawHand } from "../utilities";
import * as fp from "fingerpose";
import thumbs_up from "../../src/assets/thumbs-up.png";

const GestureRecognition = ({ adID }) => { 
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [emoji, setEmoji] = useState(null);
  const images = { thumbs_up };
  const [lastLikeTime, setLastLikeTime] = useState(0); 

  useEffect(() => {
    const loadModel = async () => {
      await tf.setBackend("webgl");
      await tf.ready();
  
      const net = await handpose.load();
      console.log("Handpose model loaded.");
  
      const detectLoop = async () => {
        await detectHands(net);
        requestAnimationFrame(detectLoop); 
      };
  
      detectLoop(); // Start loop
    };
  
    loadModel();
  }, []);
  

  useEffect(() => {
    if (emoji === "thumbs_up" && adID) {  
      const now = Date.now();
      if (now - lastLikeTime > 3000) { //prevent spam
        console.log(`Detected Thumbs Up 👍 for adID: ${adID}`);
        storeLike(adID);
        setLastLikeTime(now);
      }
    }
  }, [emoji, adID]); 

  const detectHands = async (net) => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const hand = await net.estimateHands(video);

      if (hand.length > 0) {
        const GE = new fp.GestureEstimator([fp.Gestures.ThumbsUpGesture]);

        const gesture = await GE.estimate(hand[0].landmarks, 6);
        console.log("Detected gestures:", gesture.gestures);

        if (gesture.gestures.length > 0) {
          const maxConfidenceIdx = gesture.gestures.reduce(
            (maxIdx, gesture, idx, arr) =>
              gesture.confidence > arr[maxIdx].confidence ? idx : maxIdx,
            0
          );

          const detectedGesture = gesture.gestures[maxConfidenceIdx].name;
          console.log("Detected gesture name:", detectedGesture);

          if (images[detectedGesture]) {
            setEmoji(detectedGesture);
          }
        }
      }

      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, videoWidth, videoHeight);
      drawHand(hand, ctx);
    }
    requestAnimationFrame(() => detectHands(net));
  };

  const storeLike = async (adID) => {
    if (!adID) {
      console.error("No adID available for like.");
      return;
    }

    try {
        console.log(`Sending like for adID: ${adID}`);  

        const response = await fetch("https://githubbiesbackend.onrender.com/api/store-gesture", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ adID }),
        });

        const data = await response.json();
        console.log("Like stored successfully:", data);
    } catch (error) {
        console.error("Error storing like:", error);
    }
  };

  return (
    <div className="gesture-container">
      <Webcam 
        ref={webcamRef} 
        className="webcam" 
        width={0} 
        height={0} 
        style={{ visibility: "hidden" }} 
      />
      <canvas ref={canvasRef} className="gesture-canvas" />
      {emoji && images[emoji] && (
        <img src={images[emoji]} alt="gesture" className="gesture-image" />
      )}
    </div>
  );
};

export default GestureRecognition;
