// client/src/utils/scannerUtils.js

export const isOpenCVReady = () => {
  if (typeof cv === 'undefined') return false; 
  if (!cv.Mat) return false; 
  return true; 
};

// Helper: Sort corners
const sortCorners = (points) => {
  let corners = [];
  for (let i = 0; i < points.length; i += 2) {
    corners.push({ x: points[i], y: points[i + 1] });
  }
  corners.sort((a, b) => a.y - b.y);
  const top = corners.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = corners.slice(2, 4).sort((a, b) => a.x - b.x);
  return [top[0], top[1], bottom[1], bottom[0]];
};

export const findDocumentContour = (imgElement) => {
  if (!isOpenCVReady()) return null;

  try {
      let fullSrc = cv.imread(imgElement);
      
      let src = new cv.Mat();
      let scale = 1.0;
      
      if (fullSrc.cols > 800) {
          scale = 800 / fullSrc.cols;
          let newSize = new cv.Size(800, Math.round(fullSrc.rows * scale));
          cv.resize(fullSrc, src, newSize, 0, 0, cv.INTER_AREA);
      } else {
          fullSrc.copyTo(src);
          scale = 1.0;
      }

      console.log(`Scanner: Original ${fullSrc.cols}x${fullSrc.rows} -> Scaled Detection ${src.cols}x${src.rows}`);

      let dst = new cv.Mat();
      let kernel = cv.Mat.ones(5, 5, cv.CV_8U);
      
      cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
      cv.GaussianBlur(src, src, new cv.Size(5, 5), 0);
      cv.Canny(src, dst, 30, 200);
      cv.dilate(dst, dst, kernel, new cv.Point(-1, -1), 1);

      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      const totalPixels = src.cols * src.rows;
      const minArea = totalPixels * 0.01; 
      
      let bestContour = null;
      let maxArea = 0;
      let is4Corner = false;

      for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);
        let area = cv.contourArea(cnt);
        
        if (area < minArea) {
            cnt.delete();
            continue;
        }

        let peri = cv.arcLength(cnt, true);
        let approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

        if (approx.rows === 4) {
             if (area > maxArea) {
                 if (bestContour) bestContour.delete();
                 bestContour = approx.clone();
                 maxArea = area;
                 is4Corner = true;
             }
        } else if (!is4Corner && area > maxArea) {
             if (bestContour) bestContour.delete();
             bestContour = cnt.clone();
             maxArea = area;
        }
        approx.delete();
        cnt.delete();
      }

      let resultContour = null;

      if (bestContour) {
        const upscale = 1.0 / scale;
        
        console.log(`Scanner: Found Document. Upscaling result by ${upscale.toFixed(2)}x`);

        let finalPoints;
        if (is4Corner) {
            finalPoints = bestContour;
        } else {
            let rect = cv.boundingRect(bestContour);
            finalPoints = new cv.Mat(4, 1, cv.CV_32FC2);
            finalPoints.data32S.set([
                rect.x, rect.y, 
                rect.x + rect.width, rect.y,
                rect.x + rect.width, rect.y + rect.height,
                rect.x, rect.y + rect.height
            ]);
            bestContour.delete();
        }

        resultContour = new cv.Mat(4, 1, cv.CV_32FC2);
        const data = finalPoints.data32S;
        const newData = [];
        
        for(let i=0; i<data.length; i++) {
            newData.push(Math.round(data[i] * upscale));
        }
        resultContour.data32S.set(newData);
        
        if(is4Corner) bestContour.delete();
        finalPoints.delete();

      } else {
        let width = fullSrc.cols;
        let height = fullSrc.rows;
        resultContour = new cv.Mat(4, 1, cv.CV_32FC2);
        resultContour.data32S.set([0, 0, width, 0, width, height, 0, height]);
      }

      fullSrc.delete(); src.delete(); dst.delete(); 
      contours.delete(); hierarchy.delete(); kernel.delete();

      return resultContour;

  } catch (err) {
      console.error("Scanner Crash:", err);
      return null;
  }
};

export const performWarp = (imgElement, contour) => {
  if (!isOpenCVReady()) return;
  
  try {
      let src = cv.imread(imgElement);
      const corners = sortCorners(contour.data32S);

      let srcMat = new cv.Mat(4, 1, cv.CV_32FC2);
      srcMat.data32F.set([
        corners[0].x, corners[0].y, 
        corners[1].x, corners[1].y, 
        corners[2].x, corners[2].y, 
        corners[3].x, corners[3].y
      ]);

      const widthTop = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
      const widthBottom = Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y);
      const maxWidth = Math.max(widthTop, widthBottom);

      const heightLeft = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
      const heightRight = Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y);
      const maxHeight = Math.max(heightLeft, heightRight);

      let dstMat = new cv.Mat(4, 1, cv.CV_32FC2);
      dstMat.data32F.set([0, 0, maxWidth, 0, maxWidth, maxHeight, 0, maxHeight]);

      let M = cv.getPerspectiveTransform(srcMat, dstMat);
      let dst = new cv.Mat();
      let dsize = new cv.Size(maxWidth, maxHeight);
      cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

      src.delete(); srcMat.delete(); dstMat.delete(); M.delete();
      return dst;
  } catch (err) {
      console.error("Warp Crash:", err);
      return null;
  }
};