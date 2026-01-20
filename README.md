# MERN Document Scanner (Client-Side Computer Vision)

A full-stack web application that detects, crops, and perspective-corrects documents from images or PDFs directly in the browser using open-source computer vision libraries.

## 🚀 Key Features
* **Auto-Crop Algorithm:** Custom implementation using Canny Edge Detection and contour analysis. No paid or third-party scanning APIs are used.
* **PDF Support:** Converts the first page of a PDF into an image for scanning using `pdf.js`.
* **Real-time Preview:** Client-side processing allows users to preview the scanned result before uploading.
* **Secure Gallery:** JWT-based authentication ensures users can only access their own documents.
* **Persistence:** Original and processed files are stored on the backend with associated metadata.

## 🛠 Tech Stack
* **Frontend:** React, Vite, Tailwind CSS, OpenCV.js, PDF.js
* **Backend:** Node.js, Express, Multer
* **Database:** MongoDB (Mongoose)
* **Authentication:** JWT (JSON Web Tokens), bcrypt
* **Hosting:** Frontend deployed on Netlify (static React build). Backend hosted separately.

---

## 🧠 Auto-Crop Algorithm (Overview)

Instead of relying on third-party document scanning APIs, this project implements a custom geometric computer vision pipeline in `scannerUtils.js`.

1. **Preprocessing:**  
   The input image is downscaled (for performance) and converted to grayscale to reduce complexity.

2. **Noise Reduction:**  
   A Gaussian blur (5×5 kernel) is applied to reduce texture noise (for example, desk patterns or shadows) while preserving edges.

3. **Edge Detection:**  
   Canny Edge Detection is used to extract strong structural edges from the image.

4. **Contour Detection:**  
   Contours are extracted using `cv.findContours`, and small or irrelevant contours are filtered out based on area.

5. **Document Selection:**  
   The algorithm prioritizes the largest contour approximated to four corners.  
   If no reliable quadrilateral is found, it falls back to a bounding rectangle to ensure a usable result.

6. **Perspective Correction:**  
   The detected corner points are sorted (top-left, top-right, bottom-right, bottom-left), and a perspective transform is applied using `cv.getPerspectiveTransform` and `cv.warpPerspective` to produce a flat, rectangular output.

This approach prioritizes robustness and transparency over black-box accuracy, making the logic easy to inspect and improve.

---

## ⚙️ Setup & Installation

### Prerequisites
* Node.js (v18 or higher)
* MongoDB (local instance or MongoDB Atlas)

### Backend Setup
```
cd server
npm install
```

Create a `.env` file inside the `server` directory:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=3000
```

Start the backend server:
```
npm start
```

### Frontend Setup
```
cd client
npm install
npm run dev
```

---

## 🌐 Deployment Notes

* **Frontend:** Deployed on **Netlify** as a static React (Vite) application.
* **Backend:** Hosted separately (Node.js + Express) and accessed via environment-based API URLs.
* **Reasoning:** Firebase Hosting was optional per the assignment guidelines. Netlify is used strictly for static frontend hosting and does not affect application logic, security, or compliance with the task constraints.

No paid services or closed-source APIs are used in any part of the application.

---

## 🧪 Usage

1. Register a new user account.
2. Upload an image (JPEG/PNG) or a PDF file.
3. Click **Auto-Scan** to run the document detection and perspective correction.
4. Preview the result.
5. Save the scanned document to your personal gallery.

---

## 🔧 Limitations & Future Improvements
* Currently processes only the first page of a PDF.
* Multi-document detection in a single image is not implemented.
* Additional image enhancement steps (adaptive thresholding, shadow removal) could further improve scan quality.

These trade-offs were made to keep the solution simple, transparent, and within the scope of the assignment.