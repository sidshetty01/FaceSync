"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Home, ArrowLeft } from "lucide-react";

export default function AutoScanKiosk() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Initializing...");
  const [subject, setSubject] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(true);

  const addLog = (msg: string) => {
    setLogs(prev => {
      const newLogs = [...prev, `${new Date().toLocaleTimeString()} - ${msg}`];
      if (newLogs.length > 5) newLogs.shift();
      return newLogs;
    });
  };

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("Camera active. Auto-scanning every 5 seconds.");
      } catch (err) {
        console.error("Camera error:", err);
        setStatus("Camera access denied or error.");
      }
    };
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const captureAndSend = async () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const base64Image = dataUrl.split(",")[1];

      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000') + "/api/attendance/auto-mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image })
        });
        const data = await res.json();
        
        if (data.subject) setSubject(data.subject);

        if (data.faces && data.faces.length > 0) {
          data.faces.forEach((f: any) => {
            if (f.status === "marked_present" || f.status === "marked_present_new") {
              addLog(`✅ Marked ${f.match.name} present`);
            } else if (f.status === "duplicate") {
              // addLog(`⚠️ ${f.match.name} already marked`); // noisy
            } else if (f.status === "no_match") {
              addLog(`❌ Unknown face detected`);
            }
          });
        }
        
      } catch (err) {
        console.error("Auto scan error:", err);
      }
    };

    if (isScanning) {
      interval = setInterval(captureAndSend, 5000);
    }

    return () => clearInterval(interval);
  }, [isScanning]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 relative">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500 rounded-lg animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Auto Scan Kiosk Mode</h1>
              <p className="text-slate-400">Timetable-driven attendance system</p>
            </div>
          </div>
          <button 
            onClick={() => router.push("/teacher/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Kiosk
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="relative bg-black rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl aspect-video flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs font-mono text-green-400 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
                {isScanning ? 'SCANNING ACTIVE' : 'PAUSED'}
              </div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700">
              <span className="text-slate-400 font-mono text-sm">{status}</span>
              <button 
                onClick={() => setIsScanning(!isScanning)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  isScanning 
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50' 
                    : 'bg-green-500/20 text-green-500 hover:bg-green-500/30 border border-green-500/50'
                }`}
              >
                {isScanning ? 'Pause Scanning' : 'Resume Scanning'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
              <div className="bg-slate-900/50 p-4 border-b border-slate-700">
                <h3 className="font-bold text-lg text-blue-400">Current Subject</h3>
              </div>
              <div className="p-6 flex-1 flex items-center justify-center">
                {subject ? (
                  <div className="text-center">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
                      {subject}
                    </div>
                    <div className="text-sm text-slate-400 uppercase tracking-widest font-bold">Session Active</div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500">
                    <p>No class scheduled right now</p>
                    <p className="text-xs mt-2">Checking timetable...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl flex-1 flex flex-col overflow-hidden">
              <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-emerald-400">Recent Scans</h3>
              </div>
              <div className="p-4 flex-1 overflow-y-auto font-mono text-sm flex flex-col gap-2">
                {logs.length === 0 ? (
                  <p className="text-slate-500 text-center mt-4">Waiting for faces...</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="bg-slate-900/80 p-2 rounded text-slate-300 border border-slate-800 animate-in fade-in slide-in-from-right-4 duration-300">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
