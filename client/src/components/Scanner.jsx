import { useState, useRef, useEffect, useContext } from "react";
import { findDocumentContour, performWarp, isOpenCVReady } from "../utils/scannerUtils";
import { convertPdfToImage } from "../utils/pdfUtils";
import AuthContext from "../context/AuthContext";
import axios from "axios";

const Scanner = ({ onScanComplete }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [status, setStatus] = useState("Waiting for OpenCV...");
  const [scanned, setScanned] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // NEW: Queue System
  const [fileQueue, setFileQueue] = useState([]);
  
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const { user } = useContext(AuthContext);

  // 1. Initial OpenCV Check
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOpenCVReady()) {
        setStatus("Ready to Scan");
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // 2. Watch Queue & Load First File
  useEffect(() => {
    if (fileQueue.length > 0 && !imageSrc) {
        processNextFile(fileQueue[0]);
    }
  }, [fileQueue, imageSrc]);

  const processNextFile = async (file) => {
    setStatus(`Loading ${file.name}...`);
    try {
        if (file.type === "application/pdf") {
            setStatus("Processing PDF Page 1...");
            const { url, file: convertedFile } = await convertPdfToImage(file);
            setImageSrc(url);
            setOriginalFile(convertedFile);
            setStatus(`Loaded PDF: ${file.name}`);
        } else {
            setOriginalFile(file);
            const url = URL.createObjectURL(file);
            setImageSrc(url);
            setStatus(`Loaded: ${file.name}`);
        }
        setScanned(false);
    } catch (error) {
        console.error(error);
        setStatus("Error loading file. Skipping...");
        handleSkip(); // Auto-skip bad files
    }
  };

  const handleFilesSelected = (e) => {
    if (e.target.files && e.target.files.length > 0) {
        // Add new files to the existing queue
        const newFiles = Array.from(e.target.files);
        setFileQueue(prev => [...prev, ...newFiles]);
    }
  };

  const handleScan = async () => {
    if (!imageSrc) return;
    
    try {
      setStatus("Processing High-Res Image...");
      
      const highResImg = new Image();
      highResImg.src = imageSrc;
      await highResImg.decode(); 

      const contour = findDocumentContour(highResImg);
      
      if (contour) {
        const processedMat = performWarp(highResImg, contour);
        cv.imshow(canvasRef.current, processedMat);
        processedMat.delete();
        contour.delete();
        setScanned(true); 
        setStatus("Scan Complete!");
      } else {
        setStatus("No document found. Try manual crop (not impl) or retry.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error processing image.");
    }
  };

  // Remove current file and reset state for next one
  const advanceQueue = () => {
    setImageSrc(null); // Clear current
    setOriginalFile(null);
    setScanned(false);
    setFileQueue(prev => prev.slice(1)); // Pop first item
  };

  const handleSkip = () => {
      setStatus("Skipped.");
      advanceQueue();
  };

  const handleSave = async () => {
    if (!canvasRef.current || !originalFile) return;

    setSaving(true);
    setStatus("Uploading...");

    canvasRef.current.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("original", originalFile);
      formData.append("cropped", blob, "cropped-scan.jpg");

      try {
        const config = {
            headers: { 
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${user?.token || JSON.parse(localStorage.getItem("userInfo"))?.token}`
            }
        };

        // Use Dynamic URL
        await axios.post(`${import.meta.env.VITE_API_URL}/api/documents/upload`, formData, config);
        
        setStatus("Saved!");
        setSaving(false);
        if (onScanComplete) onScanComplete();
        
        // Move to next file
        advanceQueue();

      } catch (error) {
        console.error(error);
        setStatus("Upload Failed.");
        setSaving(false);
      }
    }, "image/jpeg", 0.9);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-dark-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700 p-8">
      
      {/* Header with Queue Count */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Document Scanner</h2>
        <div className="flex justify-center gap-4 text-sm font-medium">
             <span className={status.includes("Error") ? "text-red-400" : "text-brand-400"}>
                Status: {status}
             </span>
             {fileQueue.length > 0 && (
                 <span className="text-yellow-400 bg-yellow-400/10 px-3 py-0.5 rounded-full border border-yellow-400/30">
                    Queue: {fileQueue.length} pending
                 </span>
             )}
        </div>
      </div>

      {/* Upload Zone */}
      {!imageSrc && (
        <div className="mb-8">
            <label 
            htmlFor="file-upload" 
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-800 hover:bg-gray-700 transition-all group"
            >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-3 text-gray-400 group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-white">Click to upload</span> (Select Multiple)</p>
                <p className="text-xs text-gray-500">PNG, JPG or PDF</p>
            </div>
            <input 
                id="file-upload" 
                type="file" 
                multiple // <--- ENABLED MULTIPLE
                accept="image/*,application/pdf" 
                className="hidden" 
                onChange={handleFilesSelected} 
            />
            </label>
        </div>
      )}

      {/* Preview Area */}
      {imageSrc && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-sm mb-2 uppercase tracking-wider font-semibold">Current File ({fileQueue.length} Left)</span>
            <div className="relative rounded-lg overflow-hidden border border-gray-600 shadow-lg bg-black">
               <img src={imageSrc} alt="Original" className="max-w-full h-auto max-h-[300px] object-contain" />
            </div>
          </div>

          <div className={`flex flex-col items-center transition-opacity duration-500 ${scanned ? "opacity-100" : "opacity-0 hidden md:flex"}`}>
             <span className="text-brand-400 text-sm mb-2 uppercase tracking-wider font-semibold">Scanned Result</span>
             <div className="relative rounded-lg overflow-hidden border-2 border-brand-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] bg-black">
               <canvas ref={canvasRef} className="max-w-full h-auto max-h-[300px]"></canvas>
             </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      {imageSrc && (
        <div className="flex justify-center gap-4">
            <button 
                onClick={handleSkip}
                className="px-6 py-3 bg-red-900/50 text-red-200 font-semibold rounded-lg hover:bg-red-900 border border-red-900/50"
            >
                Skip
            </button>

            <button 
                onClick={handleScan} 
                disabled={status.includes("Waiting")}
                className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-600"
            >
                Auto-Scan
            </button>

            {scanned && (
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="px-8 py-3 bg-brand-600 text-white font-bold rounded-lg shadow-lg hover:bg-brand-500"
                >
                    {saving ? "Saving..." : fileQueue.length > 1 ? "Save & Next" : "Save & Finish"}
                </button>
            )}
        </div>
      )}
    </div>
  );
};

export default Scanner;