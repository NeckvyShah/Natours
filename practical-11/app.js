const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());

app.set('view engine', 'ejs');
const port = 3000;

// Setting up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
    // specify the directory where uploaded files will be stored
    // in which folder we have to store the file
    // req- req obj
    // file-the file which user is trying to upload
    // cb- run this callback after completing the function
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
    // starting with Date.now() so if the user tries to uppload the same file thn we will have file with same name, so giving it a date touch so that file names wont be same and thn attatching it with original file name as the file name
  },
});

// middleware function for file uploads using multer
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.render('template.ejs');
});

// uploading the file
app.post('/uploadFile', upload.single('fileUpload'), (req, res) => {
  console.log(req.body);
  console.log(req.file);
  res.redirect('/');
});

// Creating the file
app.get('/createFile', (req, res) => {
  fs.writeFile('file.txt', `File created!\n`, (err, data) => {
    //   console.log('data her', data);
    if (err) {
      console.log('Error!! in reading the file');
      res.send(err.message);
    } else {
      console.log('File created successfully');
      res.send('Succesfully Created');
    }
  });
});

// Creating file if does not exist and appending to the file
app.get('/appendFile', (req, res) => {
  fs.appendFile(
    path.join(__dirname, 'fileData.txt'),
    `Hello, the file is created and content is appended\n`,
    (err) => {
      if (err) {
        console.log('Error!!');
        res.send(err.message);
      } else {
        console.log('FIle created successfully and content is appended');
        res.send('Successfull!!');
      }
    }
  );
});

// Reading file
app.get('/readFile', (req, res) => {
  fs.readFile('fileData.txt', 'utf-8', (err, data) => {
    //   console.log('data her', data);
    if (err) {
      console.log('Error!! in reading the file');
      res.send(err.message);
    } else {
      console.log('File read successfully');
      res.send(data);
    }
  });
});

// writing to the file
app.get('/writeFile', (req, res) => {
  fs.writeFile('fileData.txt', `New content added!\n`, (err, data) => {
    //   console.log('data her', data);
    if (err) {
      console.log('Error!! in reading the file');
      res.send(err.message);
    } else {
      console.log('File Written successfully');
      res.send(data);
    }
  });
});

// Reading the test-file in streams
app.get('/readFileStream', (req, res) => {
  const readable = fs.createReadStream(path.join(__dirname, 'test-file.txt'));
  readable.pipe(res);
});

app.get('/', (req, res) => {
  res.send('You are now being listened');
});

app.listen(port, () => {
  console.log(`listening to the requests on port ${port}`);
});
