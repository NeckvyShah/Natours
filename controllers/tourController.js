const error = require('../utils/appError');
const Tour = require('../models/tourModel');
const factory = require('./handlerFactory');

// MIDDLEWARE to set alias route (most common used route)
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// exports.getAllTours = async (req, res) => {
//   try {
//     // BUILD QUERY
//     // 1A.Filtering
//     const queryObj = { ...req.query };
//     const excludedFields = ['page', 'sort', 'limit', 'fields'];
//     excludedFields.forEach((el) => delete queryObj[el]);

//     // 1B.Advanced filtering
//     let queryString = JSON.stringify(queryObj);
//     queryString = queryString.replace(
//       /\b(gte|gt|lte|lt)\b/g,
//       (match) => `$${match}`
//     );
//     // console.log('querryy string here', JSON.parse(queryString));
//     let query = Tour.find(JSON.parse(queryString));
//     // Tour.find() is gonna return a query and we stored that query obj into this query variable so that we can keep chaining more methods to it(i.e on all documents that are created through the query class)

//     // 2.Sorting

//     // console.log(req.query); //{ sort: 'price' }
//     if (req.query.sort) {
//       const sortBy = req.query.sort.split(',').join(' ');
//       console.log(sortBy);
//       query = query.sort(sortBy);
//     } else {
//       query = query.sort('-createdAt');
//     }

//     // 3.FIELD LIMITING
//     if (req.query.fields) {
//       const fields = req.query.fields.split(',').join(' ');
//       query = query.select(fields);
//     } else {
//       query = query.select('-__v'); //- here means excluding(everything except this v field should be printed)
//     }

//     // 4.PAGINATION
//     const page = req.query.page * 1 || 1;
//     const limit = req.query.limit * 1 || 100;
//     const skip = (page - 1) * limit;
//     // &page=2&limit=10    1-10=>page1, 11-20=>page2 ................
//     query = query.skip(skip).limit(limit);
//     //skip- amount of result that should be skipped b4 querying the data
//     // limit- ammount of result that should be displayed per page

//     if (req.query.page) {
//       const numTours = await Tour.countDocuments();
//       if (skip >= numTours) {
//         throw new Error('This page does not exist');
//       }
//     }

//     // EXECUTE QUERY
//     const tours = await query;

//     // RESPONSE
//     res.status(200).json({
//       status: 'success',
//       results: tours.length,
//       data: {
//         tours: tours,
//       },
//     });
//   } catch (err) {
//     // res.status(404).json({
//     //   status: 'fail',
//     //   message: err,
//     // });
//     error(res, 404, err.message);
//   }
// };

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: {
          ratingsAverage: { $gte: 4.5 },
        },
      },
      {
        $group: {
          // _id: null,
          // _id: '$difficulty',
          _id: { $toUpper: '$difficulty' },
          // _id: '$ratingsAverage',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: {
          avgPrice: 1,
        },
      },
      {
        $match: { _id: { $ne: 'EASY' } },
      },
    ]);
    // const stats = await Tour.find();
    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    // res.status(400).json({
    //   status: 'fail',
    //   message: err,
    // });
    error(res, 400, err.message);
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates', //unwinding each date from the date array. so now each doc will have their own start date instead of an array
      },

      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`), //januaray 1 2021
            $lte: new Date(`${year}-12-31`),
          }, //december 31 2021 , basically we want it to be between the first date of the year and the last dateof the year
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' }, //group by month, so we extract the mnth here from the startdates
          numTourStarts: { $sum: 1 }, //no of tours in a specific mnth
          tours: { $push: '$name' }, //the name of the tour on  that date, so basically it will be in an array since there will be a lot of tours so using `$push` for creating and pushing into an array
        },
      },
      {
        $addFields: { month: '$_id' }, //add the field og the name MONTH and take its value from _id
      },
      {
        $project: {
          _id: 0, //it will not show the _id field (0-not show, 1-will show)
        },
      },
      {
        $sort: {
          numTourStarts: -1, //(1 ascending, -1 descending)
        },
      },
      {
        $limit: 6, //limit the number of documents to be displayed on scrren to 6
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (err) {
    // res.status(400).json({
    //   status: 'fail',
    //   message: err.message,
    // });
    error(res, 400, err.message);
  }
};
