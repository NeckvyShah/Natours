const express = require('express');

const app = express();

app.use((req, res, next) => {
  res.status(200).send('Hello world!');
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
