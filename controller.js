const model = require('./model');
const s3 = require('./aws');
const multer = require('multer');
const multerS3 = require('multer-s3');
const axios = require('axios');
const crypto = require('crypto');

const multerS3Storage = multerS3({
  acl: 'public-read',
  s3,
  bucket: process.env.AWS_BUCKET_NAME,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: 'TESTING_METADATA' }); //metadata can be stored in S3
  },
  key: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    file.filename = `${Date.now()}.${ext}`;
    cb(null, file.filename);
  },
});

//Choose one
const uploadS3 = multer({ storage: multerS3Storage }); //upload to S3

exports.uploadFileFunc = uploadS3.single('uploadFile');

exports.uploadMetaFunc = async (req, res) => {
  try {
    const hash = crypto.randomBytes(16).toString('hex');
    const newFile = new model({
      filePath: req.file.filename,
      fileOriginalName: req.file.originalname,
      randomHash: hash,
    });
    await newFile.save();

    const retrievedFile = await model.find({ filePath: req.file.filename }); //retrieve data from Mongo
    const postData = {
      fileId: retrievedFile[0]._id,
      userIdToken: req.headers.authorization.split(' ')[1] || null,
      fileName: retrievedFile[0].fileOriginalName,
      uploadedDate: new Date(),
      accessLimit: parseInt(req.body.accessLimit) || null, // NULL means unlimited
      timeLimit: req.body.timeLimit || null, // YYYY-MM-DD
    };

    //using Axios to send two requests simultaneously
    const [, axiosRes2] = await axios.all([
      axios.post(process.env.URL_USER + '/add', {
        type: 'FileUploaded',
        data: postData,
      }),
      axios.post(process.env.URL_META + '/add', {
        type: 'FileUploaded',
        data: postData,
      }),
    ]);

    res
      .status(200)
      .send(process.env.URL_META_PUBLIC + `/get/${axiosRes2.data._id}`);
    // res.redirect('/')
  } catch (err) {
    res.status(500).json({
      status: 'fail to upload',
      message: err,
    });
  }
};

exports.returnUrlFunc = async (req, res) => {
  try {
    console.log(req.body);
    const data = await model.find({ _id: req.body.data.fileId });

    res.status(200).json({
      type: 'HashSent',
      data: {
        hash: data[0].randomHash,
      },
      //status: 'success',
      //message: 'successfully return hash to URL-service',
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail to retrieve file path',
      message: err,
    });
  }
};

exports.downloadS3Func = async (req, res) => {
  try {
    var query = { randomHash: req.params.hash };
    const data = await model.find(query);

    // update randomHash after download
    var newValues = {
      $set: { randomHash: crypto.randomBytes(16).toString('hex') },
    };
    model.updateOne(query, newValues, function (err, res) {
      if (err) throw err;
      console.log('RandomHash updated');
    });

    console.log(data);
    const params = {
      Key: data[0].filePath,
      Bucket: process.env.AWS_BUCKET_NAME,
    };

    s3.getObject(params, function (err, data) {
      res.send(data.Body);
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail to download',
      message: err,
    });
  }
};

exports.deleteFunc = async (req, res) => {
  try {
    //S3 delete
    const { fileIds } = req.body.data;
    console.log(fileIds);

    const filePaths = await model.find({ _id: { $in: fileIds } }, 'filePath');
    const objects = filePaths.map(({ filePath }) => ({
      Key: filePath,
    }));

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Delete: {
        Objects: objects,
        Quiet: false,
      },
    };

    s3.deleteObjects(params, (err) => {
      if (err) console.log(err);
      else console.log(`deleted from S3`);
    });

    //MongoDB delete
    await model.deleteMany({ _id: { $in: fileIds } });
    res.status(204).json({
      status: 'success',
      message: `${fileIds} are successfully deleted.`,
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail to delete',
      message: err,
    });
  }
};

// Code below this line is for EJS-frontend
/////////////////////////////////////////////////////

exports.buttonReturnUrlFunc = async (req, res) => {
  try {
    const data = await model.find({ _id: req.params.id });

    res.status(200).json({
      hash: data[0].randomHash,
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail to retrieve file path',
      message: err,
    });
  }
};

exports.buttonDeleteFunc = async (req, res) => {
  try {
    //S3 delete
    const data = await model.find({ _id: req.params.id });
    const params = {
      Key: data[0].filePath,
      Bucket: process.env.AWS_BUCKET_NAME,
    };

    s3.deleteObject(params, (err) => {
      if (err) console.log(err);
      else console.log(`deleted from S3`);
    });

    //MongoDB delete
    await model.findByIdAndDelete(req.params.id);
    res.status(204).redirect('/');
  } catch (err) {
    res.status(500).json({
      status: 'fail to delete',
      message: err,
    });
  }
};

exports.pageRendering = async (req, res) => {
  try {
    const data = await model.find();
    res.status(200).render('home', { data: data });
  } catch (err) {
    res.status(500).json({
      status: 'fail to retrieve data from DB',
      message: err,
    });
  }
};
