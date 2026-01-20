const mongoose = require('mongoose');

const documentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    originalName: {
      type: String, 
      required: true 
    },
    originalFile: {
      type: String,
      required: true,
    },
    croppedFile: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['scanned', 'pending'],
      default: 'scanned'
    }
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;