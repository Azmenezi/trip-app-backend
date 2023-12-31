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
// exports.getProfile = async (req, res, next) => {
//   try {
//     const profile = await User.findById(req.foundUser._id)
//       .select("-__v -password")
//       .populate("trips", "title description image createdAt _id");
//     await req.user.updateOne({ $push: { interestedInProfiles: profile._id } });
//     return res.status(200).json(profile);
//   } catch (error) {
//     return next({ status: 400, message: error.message });
//   }
// };
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await User.findById(req.foundUser._id)
      .select("-__v -password")
      .populate("trips", "title description image createdAt _id");

    let interestedProfiles = req.user.interestedInProfiles;

    // Check if the profile._id is already in the interestedInProfiles array
    const index = interestedProfiles.indexOf(profile._id);
    if (index > -1) {
      // Remove it
      interestedProfiles.splice(index, 1);
    }

    // Check if the length has reached 20
    if (interestedProfiles.length >= 20) {
      // Remove the oldest one
      interestedProfiles.shift();
    }

    // Add the new profile._id to the end of the array
    interestedProfiles.push(profile._id);

    // Update the user document
    await req.user.updateOne({ interestedInProfiles: interestedProfiles });

    return res.status(200).json(profile);
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const profile = await User.findById(req.user._id)
      .select("-__v -password")
      .populate("trips", "title description image createdAt _id");

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
    if (!req.user._id.equals(req.foundUser._id)) {
      return next({
        status: 400,
        message: "You don't have permission to perform this task!",
      });
    }

    if (req.file) {
      // req.body.headerImage = req.file.path.replace("\\", "/");
      req.body.image = req.file.path.replace("\\", "/");
    }

    // Use the 'findByIdAndUpdate' function to update the 'headerImage'
    await User.findByIdAndUpdate(req.user._id, { $set: req.body });

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

function getRandomWord(length) {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function vowelToNumber(username) {
  const map = { a: "2", e: "5", i: "1", o: "0", u: "4" };
  return username
    .split("")
    .map((c) => map[c] || c)
    .join("");
}
exports.checkUsername = async (req, res, next) => {
  try {
    const { username } = req.body;

    const user = await User.findOne({ username });

    if (user) {
      let suggestions = [];
      let attempts = 0;
      while (suggestions.length < 5 && attempts < 50) {
        // Add an attempt counter
        attempts++; // Increment attempts counter
        let newUsername = "";
        const randomAdj = getRandomWord(5); // Get a random word of length 5
        const randomNumber = Math.floor(Math.random() * 100);

        switch (suggestions.length) {
          case 0:
            newUsername = username + randomNumber;
            break;
          case 1:
            newUsername = randomNumber + username;
            break;
          case 2:
            newUsername = vowelToNumber(username);
            break;
          case 3:
            newUsername = randomAdj + username;
            break;
          case 4:
            newUsername = username + randomAdj;
            break;
          default:
            break;
        }

        let userExists = await User.findOne({ username: newUsername });
        if (!userExists) {
          suggestions.push(newUsername);
        }
      }

      return res
        .status(200)
        .json({ message: "Username is taken", suggestions });
    }
    return res.status(200).json({ message: "Username is available" });
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};

exports.followHandler = async (req, res) => {
  // Check if the user is already following the other user
  const isUserAlreadyFollowing = req.user.followings.some((followingId) =>
    followingId.equals(req.foundUser._id)
  );

  if (isUserAlreadyFollowing) {
    // If the user is already following, then unfollow
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { followings: req.foundUser._id } },
      { new: true }
    );
    await User.findByIdAndUpdate(
      req.foundUser._id,
      { $pull: { followers: req.user._id } },
      { new: true }
    );

    res.status(200).json({ message: "User unfollowed successfully." });
  } else {
    // If the user is not following, then follow
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { followings: req.foundUser._id } },
      { new: true }
    );
    await User.findByIdAndUpdate(
      req.foundUser._id,
      { $push: { followers: req.user._id } },
      { new: true }
    );

    res.status(200).json({ message: "User followed successfully." });
  }
};

exports.getFollowers = async (req, res, next) => {
  try {
    const followers = await User.findById(req.user._id)
      .select("followers")
      .populate("followers", "username image _id");
    return res.status(200).json(followers);
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};
exports.getFollowings = async (req, res, next) => {
  try {
    const followings = await User.findById(req.user._id)
      .select("followings")
      .populate("followings", "username image _id");
    return res.status(200).json(followings);
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};

exports.getOtherFollowers = async (req, res, next) => {
  try {
    const followers = await User.findById(req.foundUser._id)
      .select("followers")
      .populate("followers", "username image _id");
    return res.status(200).json(followers);
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};

exports.getOtherFollowings = async (req, res, next) => {
  try {
    const followings = await User.findById(req.foundUser._id)
      .select("followings")
      .populate("followings", "username image _id");
    return res.status(200).json(followings);
  } catch (error) {
    return next({ status: 400, message: error.message });
  }
};
