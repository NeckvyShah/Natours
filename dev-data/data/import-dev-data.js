const { log } = require('console');
const fs = require('fs');

const mongoose = require('mongoose');

const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

require('dotenv').config();

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() =>
    console.log('DB connection Successfull 🛫 🛫 🛫 🛫 🛫 🛫 🛫 🛫 ')
  );

//   READ JSON FILE
// converting the JSON file into JS object -- it will have array of objects
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);
console.log(tours);

// IMPORT DATA INTO DATABASE
const importData = async () => {
  try {
    await Tour.create(tours); //b4 the create method accpeted an obj but the create method can also accept an array of objects, in this case it will simply create a new document for each object in the array
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded');
    process.exit();
  } catch (err) {
    console.log(err.message);
  }
};

// DELETE ALL DATA FROM DATABASE
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted');
    process.exit();
  } catch (err) {
    console.log(err.message);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
