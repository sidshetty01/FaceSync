"use client";

import React, { useRef, useEffect, useState } from "react";

export interface FaceData {
  box: [number, number, number, number];
  match: { user_id: string; name: string } | null;
  confidence?: number;
}

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  captureIntervalMs?: number | null;
  singleShot?: boolean;
  isLiveMode?: boolean;
  facesData?: FaceData[];
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  captureIntervalMs = null,
  singleShot = false,
  isLiveMode = false,
  facesData = [],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"loading" | "active" | "stopped">("stopped");
  const [cameraError, setCameraError] = useState<string>("");

  const startCamera = async () => {
    try {
      setCameraStatus("loading");
      setCameraError("");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera access is blocked because this site is not using HTTPS. Please use localhost or follow the Chrome flag instructions.");
        setCameraStatus("stopped");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true // Simple constraints for faster startup
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraStatus("active");
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission was denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError(`Failed to access camera: ${err.message || "Unknown error"}`);
      }
      setCameraStatus("stopped");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCameraStatus("stopped");
  };

  const facesDataRef = useRef<FaceData[]>(facesData);
  useEffect(() => {
    facesDataRef.current = facesData;
  }, [facesData]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || cameraStatus !== "active") return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw rectangles and IDs from the ref to ensure we have latest data without restarting interval
    facesDataRef.current.forEach((face) => {
      const [x, y, w, h] = face.box;
      ctx.strokeStyle = face.match ? "lime" : "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      if (face.match) {
        ctx.fillStyle = "lime";
        ctx.font = "16px Arial";
        ctx.fillText(`${face.match.name} (${face.match.user_id})`, x, y - 5);
      } else {
        ctx.fillStyle = "red";
        ctx.font = "16px Arial";
        ctx.fillText("Unknown", x, y - 5);
      }
    });

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    onCapture(dataUrl);
  };

  useEffect(() => {
    if (singleShot || isLiveMode) startCamera();
    return () => stopCamera();
  }, [singleShot, isLiveMode]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (captureIntervalMs && isLiveMode && cameraStatus === "active") {
      intervalRef.current = setInterval(capture, captureIntervalMs);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [captureIntervalMs, isLiveMode, cameraStatus]);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover transform -scale-x-100 ${cameraStatus === "active" ? "block" : "hidden"}`}
      />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
      
      {cameraStatus === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-blue-400 font-medium animate-pulse">Initializing Camera...</p>
        </div>
      )}

      {cameraStatus === "stopped" && !cameraError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={startCamera}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg hover:scale-105"
          >
            Start Camera
          </button>
        </div>
      )}
      
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-red-900/20 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-red-400 font-medium mb-4">{cameraError}</p>
            <button
              onClick={startCamera}
              className="text-white text-sm underline hover:text-red-300"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
