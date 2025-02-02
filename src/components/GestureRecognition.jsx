import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl"; 
import Webcam from "react-webcam";
import { drawHand } from "../utilities";
import * as fp from "fingerpose";
import thumbs_up from "../../src/assets/thumbs-up.png";
import thumbs_down from "../../src/assets/thumbs-down.png";
import { ThumbsDown } from "lucide-react";

//defining thumbs down manually
const ThumbsDownGesture = new fp.GestureDescription("thumbs_down");
ThumbsDownGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
ThumbsDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalDown, 1.0);
for (let finger of [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  ThumbsDownGesture.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
}


const GestureRecognition = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [emoji, setEmoji] = useState(null);
  const images = { thumbs_up, thumbs_down };

  useEffect(() => {
    const loadModel = async () => {
      await tf.setBackend("webgl"); 
      await tf.ready(); 
  
      const net = await handpose.load();
      console.log("Handpose model loaded.");
      detectHands(net);
    };
  
    loadModel();
  }, []);
  

  useEffect(() => {
    if (emoji) {
      console.log("Updated Emoji:", emoji);
      storeGesture(emoji);
    }
  }, [emoji]);

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
        const GE = new fp.GestureEstimator([
          fp.Gestures.ThumbsUpGesture,
          new fp.GestureDescription("thumbs_down"),
        ]);

        const gesture = await GE.estimate(hand[0].landmarks, 5);
        console.log("Detected gestures:", gesture.gestures);

if (gesture.gestures.length > 0) {
  gesture.gestures.forEach((g) => {
    console.log(`Gesture: ${g.name}, Confidence: ${g.confidence}`);
  });
}


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

  const storeGesture = async (gesture) => {
    try {
      const response = await fetch("http://localhost:5000/api/store-gesture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gesture }),
      });

      const data = await response.json();
      console.log("Gesture stored successfully:", data);
    } catch (error) {
      console.error("Error storing gesture:", error);
    }
  };

  return (
    <div className="gesture-container">
      <Webcam
        ref={webcamRef}
        className="webcam"
        width={640}
        height={480}
      />
      <canvas ref={canvasRef} className="gesture-canvas" />
      {emoji && images[emoji] && (
        <img
          src={images[emoji]}
          alt="gesture"
          className="gesture-image"
        />
      )}
    </div>
  );
};

export default GestureRecognition;
