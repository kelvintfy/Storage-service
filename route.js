const express = require('express');
const router = express.Router();
const controller = require('./controller');

//UPLOADING
//uploadFileFunc -> upload files to S3
//uploadMetaFunc -> upload meta to MongoDB
router
  .route('/upload')
  .post(controller.uploadFileFunc, controller.uploadMetaFunc);

//DOWNLOADING
router.route('/returnurl').post(controller.returnUrlFunc); //Return randomHash from MongoDB
router.route('/download/:hash').get(controller.downloadS3Func); //Retrieve path from MongoDB and download from public/uploads/

//DELETING
router.route('/delete').post(controller.deleteFunc);

module.exports = router;
