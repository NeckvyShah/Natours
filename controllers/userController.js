const error = require('../utils/appError');

const User = require('../models/userModel');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = async (req, res) => {
  try {
    // console.log(req.body);
    // 1.Create error if the user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return error(
        res,
        400,
        'This route is not for updating the passsword. Please use /updateMypassword route to update your password.'
      );
    }
    // 2.FIlter out unwanted field namesthat are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    console.log('after filter', filteredBody);

    // 3.Update the user document
    // console.log(req.body.id);
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidator: true,
      }
    );
    res.status(200).json({
      status: 'Success',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    error(res, 404, 'Not found ri8 now');
  }
};
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// setting the active flag to false
exports.deleteMe = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
      status: 'Success',
      data: null,
    });
  } catch (err) {
    error(res, 404, 'sorry', err.message);
  }
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined! Please use /signup instead',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// DO not update PASSWORDS with this
exports.updateUser = factory.updateOne(User); //only for administrators
exports.deleteUser = factory.deleteOne(User); //for administration
