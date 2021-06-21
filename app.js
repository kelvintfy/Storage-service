const express = require('express');
const controller = require('./controller');
const router = require('./route');
const path = require('path');
const app = express();
//const cors = require('cors');

app.use(express.json());
//app.use(cors());
// ---- This Part is NOT needed for upload/download ----
//Setting up temporary Frontend using EJS
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));
app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

app.get('/', controller.pageRendering);
app.get('/dud/returnurl/:id', controller.buttonReturnUrlFunc);
app.post('/dud/delete/:id', controller.buttonDeleteFunc);
// -----------------------------------------------------

app.use((process.env.NODE_ENV === 'development') ? '/dud' : '/', router);

module.exports = app;
