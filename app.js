const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
// const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const viewRouter = require('./routes/viewRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1)GLOBAL Middlewares

// serving static files
// to get static files even though its routes are not defined in the routes.js file
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// set security http headers
app.use(helmet());
//  helps enhance the security of your application by setting various HTTP headers
// calling helmet which will produce the middleware function that will be put ri8 above
// in app.use( we always need a function and not a function call
// so we are calling the function which will inturn return a function thats gonna be sitting above until it is called)
// always use it first so that all the headers are properly set

// developpment logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//The morgan middleware is used for logging HTTP requests and responses. When used with the 'dev' parameter, it generates colored output that provides information about the requests being made to the server, including the HTTP method, URL, response status, response time, and more.

// limit requests from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again in one hour!',
});

app.use('/api', limiter);

// body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));

// DATA SANITIZATION AGAINST NOSQL query injection
app.use(mongoSanitize());

// DATA SANITIZATION AGAINST cross site scripting attacks(XSS)
app.use(xss());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
// should be used by the end as it clears the duplicate query strings

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  //getting access to request headers in express(the ones that client can send along with their request)
  next();
});

// 3)ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);

app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
// to handle routes that are not available in the tour routes or userROutes
// always add thi
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server`,
  });
  next();
});

module.exports = app;
