import * as pdfjsLib from "pdfjs-dist";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const convertPdfToImage = async (file) => {
  try {
    // 1. Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 2. Load the PDF
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    // 3. Get the first page
    const page = await pdf.getPage(1);

    // 4. Set scale (high quality)
    const viewport = page.getViewport({ scale: 2.0 });

    // 5. Create a canvas to render onto
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // 6. Render
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // 7. Export as Blob URL (acts like an image file)
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve({
          url: URL.createObjectURL(blob),
          file: new File([blob], "converted-pdf-page.jpg", { type: "image/jpeg" })
        });
      }, "image/jpeg");
    });

  } catch (error) {
    console.error("PDF Conversion Error:", error);
    throw new Error("Failed to process PDF.");
  }
};