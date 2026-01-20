const express = require('express');
const router = express.Router();
const { uploadDocument, getMyDocuments } = require('../controllers/document.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const uploadFields = upload.fields([
  { name: 'original', maxCount: 1 },
  { name: 'cropped', maxCount: 1 }
]);

router.post('/upload', protect, uploadFields, uploadDocument);
router.get('/', protect, getMyDocuments);

module.exports = router;