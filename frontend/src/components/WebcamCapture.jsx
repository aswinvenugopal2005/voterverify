import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Check,
  AlertCircle,
  Sparkles,
  Loader2,
  SwitchCamera
} from 'lucide-react';

const WebcamCapture = ({ onCapture, initialCaptured = null, autoStart = true }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [capturedImage, setCapturedImage] = useState(initialCaptured);
  const [cameraError, setCameraError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Sync internal state when parent updates initialCaptured (e.g. form reset or pre-population)
  useEffect(() => {
    setCapturedImage(initialCaptured);
  }, [initialCaptured]);

  // Load available video inputs
  const refreshDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
        setDevices(videoInputs);
      }
    } catch (e) {
      console.warn("Could not enumerate video devices:", e);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsStarting(false);
  }, []);

  const startCamera = useCallback(async (deviceIdToUse = null) => {
    setCameraError(null);
    setIsStarting(true);

    // Stop any existing stream before starting a new one
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Camera API (getUserMedia) is not supported in this browser or context. Use the 'Sample Frame' simulator button below or upload a photo."
      );
      setIsStarting(false);
      return;
    }

    const deviceId = deviceIdToUse || selectedDeviceId;

    // Build constraints with fallback
    const preferredConstraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId } }
        : {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
      audio: false,
    };

    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
    } catch (primaryErr) {
      console.warn("Primary camera constraint failed, attempting generic video fallback:", primaryErr);
      try {
        // Fallback to basic video constraint without facingMode/resolution specifications
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (fallbackErr) {
        console.error("Camera access failed:", fallbackErr);
        let message =
          "Camera access unavailable or permission denied. You can use the 'Sample Camera Frame' simulator button below.";
        if (
          fallbackErr.name === 'NotAllowedError' ||
          fallbackErr.name === 'PermissionDeniedError'
        ) {
          message =
            "Camera permission was denied. Please allow camera permissions in your browser address bar settings.";
        } else if (
          fallbackErr.name === 'NotFoundError' ||
          fallbackErr.name === 'DevicesNotFoundError'
        ) {
          message =
            "No camera hardware detected. Use the 'Sample Camera Frame' simulator button or upload a photo.";
        } else if (
          fallbackErr.name === 'NotReadableError' ||
          fallbackErr.name === 'TrackStartError'
        ) {
          message =
            "Camera is currently locked or in use by another application. Close other camera apps and retry.";
        }
        setCameraError(message);
        setIsStarting(false);
        setIsStreaming(false);
        return;
      }
    }

    streamRef.current = stream;
    setIsStarting(false);
    setIsStreaming(true);

    // Attach stream to video element immediately if videoRef is mounted
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.play().catch((playErr) => {
        console.warn("Camera video play error:", playErr);
      });
    }

    // Refresh devices now that permission is granted
    refreshDevices();
  }, [selectedDeviceId, refreshDevices]);

  // Ensure stream stays attached whenever isStreaming or videoRef becomes active
  useEffect(() => {
    if (isStreaming && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.muted = true;
      }
      videoRef.current.play().catch((err) => {
        console.warn("Video play error:", err);
      });
    }
  }, [isStreaming]);

  // Handle switching camera device
  const handleDeviceChange = (e) => {
    const newDeviceId = e.target.value;
    setSelectedDeviceId(newDeviceId);
    if (isStreaming) {
      startCamera(newDeviceId);
    }
  };

  // Auto-start camera on mount if requested and no existing photo
  useEffect(() => {
    if (autoStart && !initialCaptured) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoStart]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(video, 0, 0, width, height);

    const base64Data = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(base64Data);
    stopCamera();
    if (onCapture) {
      onCapture(base64Data);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    if (onCapture) onCapture(null);
    startCamera();
  };

  // Mock test capture for devices without a physical camera or headless testing
  const captureMockTestFace = () => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Draw realistic portrait canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 400, 400);

    // Hair
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(200, 170, 100, 0, Math.PI * 2);
    ctx.fill();

    // Face Oval
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(200, 200, 80, 105, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(165, 185, 14, 9, 0, 0, Math.PI * 2);
    ctx.ellipse(235, 185, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(165, 185, 6, 0, Math.PI * 2);
    ctx.arc(235, 185, 6, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(200, 195);
    ctx.lineTo(195, 220);
    ctx.lineTo(208, 220);
    ctx.stroke();

    // Smile
    ctx.beginPath();
    ctx.arc(200, 245, 22, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    const mockData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(mockData);
    stopCamera();
    if (onCapture) {
      onCapture(mockData);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800 text-white p-4">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <Camera className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Biometric Facial Camera
          </h3>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isStreaming
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : isStarting
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
              : capturedImage
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {isStreaming
            ? 'Live Stream Active'
            : isStarting
            ? 'Connecting...'
            : capturedImage
            ? 'Snapshot Frozen'
            : 'Standby'}
        </span>
      </div>

      {/* Camera switcher if multiple hardware video devices detected */}
      {devices.length > 1 && (
        <div className="mb-2.5 flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/60">
          <SwitchCamera className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] font-medium text-slate-400 shrink-0">Device:</span>
          <select
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-0.5 focus:outline-none focus:border-blue-500"
          >
            {devices.map((device, idx) => (
              <option key={device.deviceId || idx} value={device.deviceId}>
                {device.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {cameraError && (
        <div className="mb-3 p-3 bg-rose-950/50 border border-rose-800/60 rounded-lg flex items-start space-x-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1">
            <p className="font-semibold">Webcam Notification</p>
            <p className="text-[11px] text-rose-300/80">{cameraError}</p>
          </div>
        </div>
      )}

      {/* Viewport Box */}
      <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
        {/* Hidden Canvas for rasterization */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video stream element: ALWAYS kept mounted in DOM so stream can attach reliably */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            !capturedImage && isStreaming ? 'block' : 'hidden'
          }`}
        />

        {/* 1. Captured Image Preview */}
        {capturedImage ? (
          <div className="w-full h-full relative">
            <img
              src={capturedImage}
              alt="Captured Biometric Photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-emerald-900/80 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm border border-emerald-500/30 flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>Face Frame Captured</span>
            </div>
          </div>
        ) : isStreaming ? (
          /* 2. Live Video Feed Scanning Overlay */
          <>
            {/* Visual alignment guide */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-60 border-2 border-dashed border-blue-400/60 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-blue-300/80 uppercase tracking-widest font-mono">
                  Align Face Here
                </span>
              </div>
            </div>
            {/* Glowing scanline */}
            <div className="animate-scan pointer-events-none" />
          </>
        ) : isStarting ? (
          /* Initializing / Connecting Spinner */
          <div className="text-center p-6 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-300">Initializing Biometric Camera Feed...</p>
            <p className="text-[11px] text-slate-500">Please grant camera permissions if prompted</p>
          </div>
        ) : (
          /* Inactive Standby State */
          <div className="text-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <CameraOff className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-slate-400">Webcam currently inactive</p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              Click 'Start Camera' to open your webcam preview, or test using the sample capture frame.
            </p>
          </div>
        )}
      </div>

      {/* Control Buttons Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {!capturedImage ? (
          <>
            {!isStreaming ? (
              <button
                type="button"
                id="btn-start-camera"
                onClick={() => startCamera()}
                disabled={isStarting}
                className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-md shadow-blue-600/30 disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting Camera...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Start Camera</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  id="btn-capture-photo"
                  onClick={capturePhoto}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-md shadow-emerald-600/30"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Capture Photo</span>
                </button>
                <button
                  type="button"
                  id="btn-stop-camera"
                  onClick={stopCamera}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Stop
                </button>
              </>
            )}

            {/* Test snapshot fallback */}
            <button
              type="button"
              id="btn-mock-capture"
              onClick={captureMockTestFace}
              className="flex items-center space-x-1 px-3 py-2 bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-300 border border-indigo-700/50 rounded-lg text-xs font-medium transition-colors"
              title="Generate a sample test face for verification without physical webcam"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sample Frame</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            id="btn-retake-photo"
            onClick={retakePhoto}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retake Photo</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;
