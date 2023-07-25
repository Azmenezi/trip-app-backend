
const Trip = require("../../models/Trip");
const User = require("../../models/User");


exports.fetchTrip = async (tripId, next) => {
  try {
    const trip = await Trip.findById(tripId);
    return trip;
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};

exports.addTrip = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Only members are authorized to add a trip",
      });
    }

    if (req.file) {
      req.body.image = `${req.file.path.replace("\\", "/")}`;
    }

    const { title } = req.body;
    if (title == "") {
      return res.status(403).json({ message: "Field can't be empty" });
    }

    const existingTrip = await Trip.findOne({ title });
    if (existingTrip) {
      return res.status(400).json({ message: "Trip already exists" });
    }

    const trip = await Trip.create({
      title: req.body.name,
      description: req.body.ingredients,
      image: req.body.image,
      creator: req.user._id,
    });

    req.user.trips = [...req.user.trips, trip._id];

    await user.save();
    return res.status(201).json(trip);
  } catch (err) {
    next(err);
  }
};

exports.deleteTrip = async (req, res, next) => {
  try {
    console.log(req.user._id, req.trip.creator);
    if (!req.user._id.equals(req.tripe.creator))
      return next({
        status: 401,
        message: "You can not delete other persons trip",
      });

    await req.trip.deleteOne();
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
};

exports.getAllTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find();
    return res.status(200).json(trips);
  } catch (error) {
    return next(error);
  }
};
