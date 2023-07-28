// const util = require('util'); //for promisifyiung the function(util has a built in method for that) so that we can use async await normally

const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const User = require('../models/userModel');

const error = require('../utils/appError');

const sendEmail = require('../utils/emails');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  ), //CONVERTING TO MILLISECONDS
  // secure: true, //only send over https
  httpOnly: true, //cookie cannot be modified by browser(to prevent cross side scripting attacks (what the broser will do? receiver the cookie,store it and send laong wwith every  requests))
};
if (process.env.NODE_ENV === 'production') {
  cookieOptions.secure = true;
}
const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.cookie('jwt', token, cookieOptions);
  // remove the password from the oiutput of postman
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success!!',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = async (req, res) => {
  try {
    // const newUser = await User.create(req.body);
    const newUser = await User.create({
      role: req.body.role,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
    });
    // console.log(newUser);

    createAndSendToken(newUser, 201, res);
    // const token = signToken(newUser._id);
    // // console.log(req.body);
    // res.status(201).json({
    //   status: 'Success',
    //   token,
    //   data: {
    //     user: newUser,
    //   },
    // });
  } catch (err) {
    error(res, 400, err.message);
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // 1. check if email and password exist
  if (!email || !password) {
    return error(res, 400, 'Please provide email and password');
  }
  //2. check if the user exists && the password is correct
  const user = await User.findOne({ email }).select('+password');

  // console.log('user here', user);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return error(res, 400, 'Please enter valid Email or Password');
  }

  // 3.if everything is ok, send the token to the client
  createAndSendToken(user, 200, res);
  // const token = signToken(user._id);
  // // console.log(token);
  // res.status(200).json({
  //   status: 'success', //
  //   token,
  //   message: 'succesful',
  // });
};

// middleware function (to check if the user is actually logged in )
exports.protect = async (req, res, next) => {
  try {
    let token;
    // 1. getting token and check if the token exists
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // console.log(token);
    if (!token) {
      return error(
        res,
        401,
        'You are not logged in! Please log in to get access'
      );
    }
    // 2.validate the token (verification of the token)
    // verifying if someone manipulated the data or if the token has already expired
    // console.log(process.env.JWT_SECRET);

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    // the resolved value of this promise will have the decoded payload
    console.log(decoded); //{ id: '646f5d9e5a5b76e81d98d41d', iat: 1685354919, exp: 1693130919 }

    // 3.if the verification is successful thn we need to check if the user who is trying to access the route still exists
    // (check if user still exists)
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        error(res, 401, 'The user belonging to this token does not exist 🙆🙆 ')
      );
    }

    // 4. check if user changed password after the JWT token was issued
    // creating instance method
    if (currentUser.changedPassowrdAfter(decoded.iat)) {
      return error(
        res,
        401,
        'User recently changed password. Please log in again!'
      );
    }

    // grant access to protected route
    // req obj is the one that travelsbasically from middleware to middleware
    // so if we want  to pass some data from one middleware to another middleware thn we simply put some stuff on the req object and thn that data will be available at a later point
    req.user = currentUser;
    next();
  } catch (err) {
    console.log(err.message);
    error(res, 401, `you are not authorized to get information on ${req.url}`);
  }
};

// eslint-disable-next-line arrow-body-style
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles=['admin','lead-guide'].  if role='user
    if (!roles.includes(req.user.role)) {
      return error(
        res,
        403,
        'You do not have permission to perform this action'
      );
    }
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  try {
    // 1.Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return error(res, 404, 'There is no user with this email address');
    }
    // 2. Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3. Send it to user's email address
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    // https://127.0.0.1/api/v1/users/resetPasswordreserToken -url
    const message = `Forgot your password? Submit a PATCH request with your new password  and passwordConfirm to : ${resetURL}.\n If you didn't forgot your password, please ignore this email`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 min)',
        message,
      });

      res.status(200).json({
        status: 'Success',
        message: 'Token sent to email',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return error(
        res,
        500,
        'There was an error sending the email. try again later'
      );
    }
  } catch (err) {
    return error(
      res,
      401,
      'THere is no user with this email address',
      err.message
    );
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1.Get user based on the token

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    // console.log('Cheking the user :people🔍🔍🔍 ', user);
    // 2. Set the new password (but only if token has not expired and there is a user)
    if (!user) {
      return error(
        res,
        400,
        'User not found because the token is invalid or has expired'
      );
    }
    console.log(req.body);
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    // deleting the reset token and the expired
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 3.Update the changedPasswordAt property for the current user

    // 4.Log the user in, send the JWT
    createAndSendToken(user, 200, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //   status: 'Success',
    //   token,
    // });
  } catch (err) {
    return error(res, 404, err.message);
  }
};

exports.updatePassword = async (req, res) => {
  try {
    console.log('Updating password');
    // 1.get user from collection
    const user = await User.findById(req.user.id).select('+password');
    // 2.check if the posted password is correct
    // console.log(user);
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return error(res, 401, 'yOUR CURRENT PASSWORD IS WRONG');
    }
    // 3. if the password is correct thn update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // 4. log user in, send JWT
    createAndSendToken(user, 200, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //   status: 'Success',
    //   token,
    // });
  } catch (err) {
    return error(res, 404, err.message);
  }
};
