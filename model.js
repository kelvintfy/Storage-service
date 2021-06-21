const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  filePath: {
    type: String,
    required: [true, 'A file must have a file path.'],
  },
  uploadedAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  fileOriginalName: {
    type: String,
    required: true,
  },
  randomHash: {
    type: String,
    required: true,
  }
});

const model = mongoose.model('filesData', schema);

module.exports = model;
