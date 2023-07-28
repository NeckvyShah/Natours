const error = require('../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) => async (req, res) => {
  try {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return error(res, 404, 'No tour found with that id');
    }
    res.status(204).json({
      status: 'success',
      data: null,
      // the resource that we deleted, no longer exists
    });
  } catch (err) {
    error(res, 400, err.message);
  }
};

// findByIdAndUpdate - all the save middleware will not run so try not to use the update for updating the passwprds
exports.updateOne = (Model) => async (req, res) => {
  try {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //return updated doc (because by default the update does not send the record so we need to pass additional parameter fr it)
      runValidators: true,
    });
    if (!doc) {
      return error(res, 404, 'No document found with that id');
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  } catch (err) {
    error(res, 400, err.message);
  }
};

exports.createOne = (Model) => async (req, res) => {
  try {
    // const newTour = new Tour({ name: 'The Park Camper', price: 497 });
    // newTour.save();  //model.prototype.save() -is available on all instances created from the model but not on the model itself

    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  } catch (err) {
    error(res, 400, err.message);
  }
};

exports.getOne = (Model, popOptions) => async (req, res) => {
  try {
    let query = Model.findById(req.params.id);
    if (popOptions) {
      query = query.populate(popOptions);
    }
    const doc = await query;
    // doc.findOne({_id: req.params.id})
    if (!doc) {
      return error(res, 404, 'No document found witht that ID');
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  } catch (err) {
    error(res, 404, err.message);
  }
};

exports.getAll = (Model) => async (req, res) => {
  try {
    // To allow for nested GET reviews on tour (its a hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    // const doc = await features.query.explain();

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  } catch (err) {
    error(res, 404, err.message);
  }
};
