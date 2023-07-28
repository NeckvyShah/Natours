const error = (res, statusCode, msg, err) => {
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      status: 'fail',
      error: err,
      message: msg,
    });
  } else if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      status: 'fail',
      message: msg,
    });
  }
};

module.exports = error;
