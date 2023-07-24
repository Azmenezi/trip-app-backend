const User = require("../../models/User");
const passHash = require("../../utils/auth/passhash");
const generateToken = require("../../utils/auth/generateToken");

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
    const profile = await req.foundUser
      .findOne()
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

// exports.showUserProfile = async (req, res, next) => {
//   const {userId}= req.params;
//   try {
//     const tripsByOwner= Trips.

//   } catch (error) {
//     return next({ status: 400, message: error.message });
//   }
// };
