const mongoose = require('mongoose');
require('dotenv').config();
// a dotenv is used to store “environment variables” AKA variables we need to configure our code environment.
const app = require('./app');

// console.log(process.env);
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// to deal with some deprecation warnings
// hposted DB connection
mongoose
  // .connect(process.env.DATABASE_LOCAL,{}) ---to connect to local database
  .connect(DB, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB CONNECTION SUCESSFUL ⏩ ⏩ ⏩ ⏩ ⏩ ');
  });

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
