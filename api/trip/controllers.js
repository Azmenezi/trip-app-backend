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

    const trip = await Trip.create({
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
      creator: req.user._id,
    });

    // req.user.trips = [...req.user.trips, trip._id];
    await req.user.updateOne({ $push: { trips: trip._id } });

    // await user.save();
    return res.status(201).json(trip);
  } catch (err) {
    next(err);
  }
};

exports.deleteTrip = async (req, res, next) => {
  try {
    if (!req.user._id.equals(req.trip.creator))
      return next({
        status: 401,
        message: "You can not delete other persons trip",
      });

    await req.trip.deleteOne();
    await User.findByIdAndUpdate(req.user._id, {
      pull: { trips: req.trip._id },
    });
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
exports.getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.trip._id).populate(
      "creator",
      "username image trips trips likedTrips savedTrips _id"
    );
    return res.status(200).json(trip);
  } catch (error) {
    return next(error);
  }
};
exports.likeTrip = async (req, res) => {
  // Check if the user has already liked the trip
  const hasUserAlreadyLiked = req.user.likedTrips.some((likedTripId) =>
    likedTripId.equals(req.trip._id)
  );

  if (hasUserAlreadyLiked) {
    // If the user has already liked the trip, unlike it
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { likedTrips: req.trip._id } },
      { new: true }
    );
    await Trip.findByIdAndUpdate(
      req.trip._id,
      { $pull: { likes: req.user._id } },
      { new: true }
    );

    res.status(200).json({ message: "Trip unliked successfully." });
  } else {
    // If the user hasn't liked the trip, like it
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { likedTrips: req.trip._id } },
      { new: true }
    );
    await Trip.findByIdAndUpdate(
      req.trip._id,
      { $push: { likes: req.user._id } },
      { new: true }
    );

    res.status(200).json({ message: "Trip liked successfully." });
  }
};

exports.saveTrip = async (req, res) => {
  // Check if the user has already saved the trip
  const hasUserAlreadySaved = req.user.savedTrips.some((savedTripId) =>
    savedTripId.equals(req.trip._id)
  );

  if (hasUserAlreadySaved) {
    // If the user has already saved the trip, unsave it
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedTrips: req.trip._id } },
      { new: true }
    );

    res.status(200).json({ message: "Trip unsaved successfully." });
  } else {
    // If the user hasn't saved the trip, save it
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { savedTrips: req.trip._id } },
      { new: true }
    );

    res.status(200).json({ message: "Trip saved successfully." });
  }
};

exports.getLikedTrips = async (req, res, next) => {
  try {
    const trips = await User.findById(req.user._id)
      .select("likedTrips")
      .populate("likedTrips", "image createdAt _id");
    return res.status(200).json(trips);
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};
exports.getSavedTrips = async (req, res, next) => {
  try {
    const trips = await User.findById(req.user._id)
      .select("savedTrips")
      .populate("savedTrips", "image createdAt _id");
    return res.status(200).json(trips);
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};
