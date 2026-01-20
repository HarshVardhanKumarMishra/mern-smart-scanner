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

    const imgRef = useRef(null);
    const canvasRef = useRef(null);
    const { user } = useContext(AuthContext); 

    useEffect(() => {
        const interval = setInterval(() => {
            if (isOpenCVReady()) {
                setStatus("Ready to Scan");
                clearInterval(interval);
            }
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setStatus("Loading file...");

        try {
            if (file.type === "application/pdf") {
                setStatus("Processing PDF...");
                const { url, file: convertedFile } = await convertPdfToImage(file);

                setImageSrc(url);
                setOriginalFile(convertedFile); 
                setStatus("PDF Page 1 Loaded. Click 'Scan'.");
            } else {
                setOriginalFile(file);
                const url = URL.createObjectURL(file);
                setImageSrc(url);
                setStatus("Image Loaded. Click 'Scan'.");
            }
            setScanned(false);
        } catch (error) {
            console.error(error);
            setStatus("Error loading file. Please try an image.");
        }
    };

    const handleScan = async () => {
    console.log("1. Scan button clicked");

    if (!imageSrc) {
        setStatus("Error: No image loaded.");
        return;
    }
    
    try {
      setStatus("Processing High-Res Image...");
      
      const highResImg = new Image();
      highResImg.src = imageSrc;
      
      await highResImg.decode(); 

      console.log(`2. High-Res Loaded: ${highResImg.width}x${highResImg.height}`);

      const contour = findDocumentContour(highResImg);
      
      if (contour) {
        console.log("3. Contour found, performing High-Res Warp...");
        
        const processedMat = performWarp(highResImg, contour);
        
        cv.imshow(canvasRef.current, processedMat);
        
        processedMat.delete();
        contour.delete();
        
        setScanned(true); 
        setStatus("Scan Complete! (High Quality)");
      } else {
        setStatus("No document found. Try a clearer image.");
      }
    } catch (err) {
      console.error("CRASH:", err);
      setStatus("Error processing image.");
    }
  };

    const handleSave = async () => {
        if (!canvasRef.current || !originalFile) return;

        setSaving(true);
        setStatus("Uploading...");

        // 1. Convert Canvas to Blob (Image File)
        canvasRef.current.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append("original", originalFile);
            formData.append("cropped", blob, "cropped-scan.jpg");

            try {
                // 2. Get Token from localStorage (Manual grab to be safe)
                const userInfo = JSON.parse(localStorage.getItem("userInfo"));
                const token = userInfo?.token;

                const config = {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`
                    }
                };

                // 3. Send to Server
                await axios.post(`${import.meta.env.VITE_API_URL}/api/documents/upload`, formData, config);

                setStatus("Saved to Gallery!");
                setSaving(false);
                if (onScanComplete) onScanComplete(); 
            } catch (error) {
                console.error(error);
                setStatus("Upload Failed.");
                setSaving(false);
            }
        }, "image/jpeg", 0.9);
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-dark-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700 p-8">

            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Document Scanner</h2>
                <p className={`text-sm font-medium ${status.includes("Error") ? "text-red-400" : "text-brand-400"
                    }`}>
                    Status: {status}
                </p>
            </div>

            {/* Upload Zone */}
            <div className="mb-8">
                <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-800 hover:bg-gray-700 transition-all group"
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-10 h-10 mb-3 text-gray-400 group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-white">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">PNG, JPG or PDF (MAX. 5MB)</p>
                    </div>
                    <input
                        id="file-upload"
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                {imageSrc && (
                    <div className="flex flex-col items-center">
                        <span className="text-gray-400 text-sm mb-2 uppercase tracking-wider font-semibold">Original</span>
                        <div className="relative rounded-lg overflow-hidden border border-gray-600 shadow-lg">
                            <img
                                id="uploaded-image"  
                                ref={imgRef}
                                src={imageSrc}
                                alt="Original"
                                className="max-w-full h-auto max-h-[300px] object-contain"
                                onLoad={() => setStatus("Image Ready. Click Scan.")}
                            />
                        </div>
                    </div>
                )}

                {/* Cropped Result Card */}
                <div className={`flex flex-col items-center transition-opacity duration-500 ${scanned ? "opacity-100" : "opacity-0 hidden md:flex"}`}>
                    <span className="text-brand-400 text-sm mb-2 uppercase tracking-wider font-semibold">Scanned Result</span>
                    <div className="relative rounded-lg overflow-hidden border-2 border-brand-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                        <canvas ref={canvasRef} className="max-w-full h-auto max-h-[300px]"></canvas>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={handleScan}
                    disabled={!imageSrc || status.includes("Waiting")}
                    className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                >
                    Auto-Scan Document
                </button>

                {scanned && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-brand-600 text-white font-bold rounded-lg shadow-lg hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Saving...
                            </>
                        ) : "Save to Gallery"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Scanner;