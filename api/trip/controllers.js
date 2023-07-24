const User = require("../../models/Trip");
const Trip = require("../../models/Trip");

exports.fetchUser = async (userId, next) => {
  try {
    const user1 = await User.findById(userId);
    return user1;
  } catch (error) {
    return next({ status: 400, message: error.message });
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
