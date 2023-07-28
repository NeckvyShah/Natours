const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authenticationController');
const reviewRouter = require('../routes/reviewRoutes');
// convention to use Router when routing
const router = express.Router();

// mergeParams for nexted routes
router.use('/:tourId/reviews', reviewRouter);
// router itself is a middleware so we can use `use` method on it
//  `/`- /api/v1/tours because we have mounted this in app.js
// we are basically mounting the route here as we did in app.js but the reviewROuter wont be able to get access to the tourId (because each router get access to the parameteres to their specific rouets) so going to reviewRutes.js, we will use merge params

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
