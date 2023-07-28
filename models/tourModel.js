/* eslint-disable prefer-arrow-callback */
const mongoose = require('mongoose');

const slugify = require('slugify');

// const User = require('./userModel'); required for embedding not referencing

const validator = require('validator');
const Review = require('./reviewModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name 🤨 '],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal thn 40 characters'],
      minlength: [10, 'A tour name must have more or equal thn 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },

    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy,medium or difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price 🤨 '],
    },

    priceDiscount: {
      type: Number,
      validate: function (value) {
        return value < this.price; //100<200
      },
    },

    summary: {
      type: String,
      trim: true, //only works foor strings- willremove the whitespace in the end and beginning
      required: [true, 'A tour must have description summary 🤦 '],
    },

    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String, //name of the img- ref will be stored in DB
      required: [true, 'A tour must have a cover image 🤨 '],
    },

    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    startDates: [Date], //diff dates ar which the tour starts
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    location: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
      },
    ],

    // here is array of guides because it is one to many relationshio. one tour can have ,many guides, so we have to specify the guides id in an array
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        // we expect the type of each of the elements in the guides array to be a MongoDB ID
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// virtual populate for get tour and not getAll tours
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //name of the field in the review model(other model)where the reference to this mdel is stored
  localField: '_id', //where the id is currently stored in tour model, to conect the two properties
});

// DOCUMENT MIDDLEWARE: runs b4 the .save() command and .create() command
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); //"slug": "the-test-tour-2",
  next();
});

// emdbedding the guides
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('will save doc');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  //to calculate how long it takes to execute the query
  this.start = Date.now(); //we can specify any propery to this `this` obj as it is a normal obj
  next();
});

// tourSchema.pre('findOne', function (next) {
//   this.find({ secretTour: { $ne: true } });
//   next();
// });

// populating users in tour
tourSchema.pre(/^find/, function (next) {
  // this point to the current query (and that is of find)
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`query took ${Date.now() - this.start}ms`);
  // console.log(docs);
  next();
});

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
