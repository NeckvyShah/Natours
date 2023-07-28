const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
// const { default: isEmail } = require('validator/lib/isEmail');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your NAME!'],
  },

  email: {
    type: String,
    required: [true, 'Please provide us your email address'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide us a valid email address'],
  },

  photo: String,

  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'], // It defines an enumeration of possible values for the role property. The allowed values are 'user', 'guide', 'lead-guide', and 'admin'. This means that the role property can only have one of these values.

    default: 'user',
    //It sets the default value of the role property to 'user'. If no value is explicitly provided for role, it will default to 'user'.
  },

  password: {
    type: String,
    required: [true, 'Please provide us your password'],
    minlength: 8,
    select: false, //so that it never shows up in the db
  },

  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    // THIS ONLY WORKS ON CREATE AND SAVE(.create() and .save())
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Please enter the same password',
    },
  },

  passwordChangedAt: Date,

  passwordResetToken: String,

  passwordResetExpires: Date,
  // this reset will expire after a certain amount of time. S o you only have 10 mins to reset your password

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // only run this function if password is  modified
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  // delete the password confirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; //will put passwordCHangedAt  1 sec in the past (will ensure that the token was created afer the password has been changed/*  */
  next();
});

// string or words that starts with find
userSchema.pre(/^find/, function (next) {
  // this points to current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPassowrdAfter = function (JWTTimestamp) {
  // JWTTimestamp is the timestamp when the token was issued
  if (this.passwordChangedAt) {
    //this keyword points to the current doc
    //if the passwordChangedAt property exists thn we want to do the comparison
    // if it does not exist that means the user has not changed their password so we will return false

    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp; //wed may 31 2023<thursday 29 june 2023
  }
  // FALSE MEANS NOT CHANGED
  return false;
  // by default we return false so it means that the user has not changed his passsword
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // this token is what we will be sending to the user
  // basically it is a password that the user can use to create new password
  // if a hacker gets access to your account thn he can use this to create new password and can control your acc
  // so we should not store it in a plain text format
  // so we will encrypt it
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // we want to save this token to the db so we can compare it with the toke the user provvides

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken; //(we are sending through email the unencrypted token because other wise it wouldnt ,make much sense to encrypt it at all)
  // we send one token via email and keep the encrypted verison in the DB. and that encrypoted one is basically useless to reset the password
  // we only save sensitive data in encrypoted form
};

const User = mongoose.model('User', userSchema);
module.exports = User;
