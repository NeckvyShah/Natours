const Tour = require('../models/tourModel');
const error = require('../utils/appError');

exports.getOverview = async (req, res) => {
  try {
    // 1. get tour data from collection
    const tours = await Tour.find();
    // 2. build template
    // 3. render that template using our tour data from 1
    res.status(200).render('overview', {
      title: 'All tours',
      tours,
    });
  } catch (err) {
    error(res, 404, 'Not found please', err.message);
  }
};
exports.getTours = (req, res) => {
  res.status(200).render('tour', {
    title: 'The Forest Hiker Tour',
  });
};
