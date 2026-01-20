const Document = require('../models/document.model');

// @desc    Upload original and cropped images
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = async (req, res) => {
  try {
    
    if (!req.files || !req.files.original || !req.files.cropped) {
      return res.status(400).json({ message: 'Both original and cropped images are required' });
    }

    const originalFile = req.files.original[0];
    const croppedFile = req.files.cropped[0];

    const doc = await Document.create({
      user: req.user._id, 
      originalName: originalFile.originalname,
      originalFile: originalFile.filename,
      croppedFile: croppedFile.filename,
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during upload' });
  }
};

// @desc    Get all documents for logged in user
// @route   GET /api/documents
// @access  Private
const getMyDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching documents' });
  }
};

module.exports = { uploadDocument, getMyDocuments };