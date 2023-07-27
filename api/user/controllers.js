const User = require("../../models/User");
const passHash = require("../../utils/auth/passhash");
const generateToken = require("../../utils/auth/generateToken");
const Trip = require("../../models/Trip");

// Everything with the word user is a placeholder that you'll change in accordance with your project

exports.fetchUser = async (userId, next) => {
  try {
    const user1 = await User.findById(userId);
    return user1;
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-__v -password -trips");
    return res.status(200).json(users);
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await User.findById(req.foundUser._id)
      .select("-__v -password")
      .populate("trips", "title description image _id");
    return res.status(200).json(profile);
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const profile = await User.findById(req.user._id)
      .select("-__v -password")
      .populate("trips", "title description image _id");
    return res.status(200).json(profile);
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};
exports.createUser = async (req, res, next) => {
  try {
    if (req.file) {
      req.body.image = `${req.file.path.replace("\\", "/")}`;
    }
    if (!req.body.image)
      return next({ status: 400, message: "no image was uploaded!" });

    const { password } = req.body;
    req.body.password = await passHash(password);
    const newUser = await User.create(req.body);
    const token = generateToken(newUser);
    res.status(201).json({ token });
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const token = generateToken(req.user);
    return res.status(200).json({ token });
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    if (!req.user._id.equals(req.foundUser._id))
      return next({
        status: 400,
        message: "you dont have the permission to preform this task!",
      });

    if (req.file) {
      req.body.image = `${req.file.path.replace("\\", "/")}`;
    }

    await User.findByIdAndUpdate(req.user.id, req.body);
    return res.status(204).end();
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (!req.user._id.equals(req.foundUser._id))
      return next({
        status: 400,
        message: "you dont have the permission to preform this task!",
      });
    await User.findByIdAndRemove({ _id: req.user.id });
    return res.status(204).end();
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};

exports.showUserProfile = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const userProfile = await User.findById(userId);
    if (!userProfile) {
      return next({ status: 400, message: "User not found!" });
    }
    res.json(userProfile);
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};

exports.displayTripsByOwner = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const tripByOwner = await Trip.find({ user: userId });
    if (tripByOwner.length === 0) {
      return res.json({ message: "No trips found for this user" });
    }
    res.json(tripByOwner);
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};
