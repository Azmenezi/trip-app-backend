const mongoose = require("mongoose");
const Trip = require("../../models/Trip");
const Hashtag = require("../../models/Hashtag");
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
      return res.status(401).json({
        message: "Only members are authorized to add a trip",
      });
    }

    if (req.file) {
      req.body.image = `${req.file.path.replace("\\", "/")}`;
    }

    const { title, hashtags } = req.body;
    if (title === "") {
      return res.status(403).json({ message: "Field can't be empty" });
    }

    const trip = await Trip.create({
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
      creator: req.user._id,
    });

    const hashtagModels = [];
    if (hashtags) {
      const tags = hashtags.split(",");
      for (let tag of tags) {
        // Remove the '#' from the beginning of the hashtag
        if (tag[0] === "#") {
          tag = tag.slice(1);
        }

        let hashtag = await Hashtag.findOne({ name: tag });
        if (!hashtag) {
          hashtag = await Hashtag.create({ name: tag });
        }
        hashtag.trips.push(trip._id);
        await hashtag.save();
        hashtagModels.push(hashtag);
      }
    }

    trip.hashtags = hashtagModels.map((hashtag) => hashtag._id);
    await trip.save();

    await req.user.updateOne({ $push: { trips: trip._id } });

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

    // Find the associated hashtags and remove the trip from each one
    await Hashtag.updateMany(
      { trips: req.trip._id },
      { $pull: { trips: req.trip._id } }
    );

    await req.trip.deleteOne();
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { trips: req.trip._id },
    });

    return res.status(204).end();
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

    let interestedTrips = req.user.interestedInTrips;

    // Check if the trip._id is already in the interestedInTrips array
    const index = interestedTrips.indexOf(trip._id);
    if (index > -1) {
      // Remove it
      interestedTrips.splice(index, 1);
    }

    // Check if the length has reached 20
    if (interestedTrips.length >= 20) {
      // Remove the oldest one
      interestedTrips.shift();
    }

    // Add the new trip._id to the end of the array
    interestedTrips.push(trip._id);

    // Update the user document
    await req.user.updateOne({ interestedInTrips: interestedTrips });

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

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

// async function calculateUserInterestScore(userId) {
//   // Find the user with the provided userId
//   const user = await User.findById(userId)
//     .populate("trips")
//     .populate("likedTrips")
//     .populate("savedTrips");

//   if (!user) {
//     throw new Error("User not found");
//   }

//   let tripScores = {};

//   // User's own trips, add score 5
//   user.trips.forEach((trip) => {
//     tripScores[trip._id] = (tripScores[trip._id] || 0) + 5;
//   });

//   // User's liked trips, add score 4
//   user.likedTrips.forEach((trip) => {
//     tripScores[trip._id] = (tripScores[trip._id] || 0) + 4;
//   });

//   // User's saved trips, add score 3
//   user.savedTrips.forEach((trip) => {
//     tripScores[trip._id] = (tripScores[trip._id] || 0) + 3;
//   });

//   // Convert the scores object to an array
//   const scoredTrips = Object.entries(tripScores).map(([tripId, score]) => ({
//     tripId,
//     score,
//   }));

//   // Sort the array by score in descending order
//   scoredTrips.sort((a, b) => b.score - a.score);

//   return scoredTrips;
// }

async function calculateUserInterestScore(userId) {
  // Find the user with the provided userId
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  let tripScores = {};

  // Keep only the last 3 trips, likedTrips and savedTrips
  const trips = user.trips.slice(-3);
  const likedTrips = user.likedTrips.slice(-3);
  const savedTrips = user.savedTrips.slice(-3);

  // User's trips, add score 3
  trips.forEach((trip) => {
    tripScores[trip._id] = (tripScores[trip._id] || 0) + 3;
  });

  // User's liked trips, add score 2
  likedTrips.forEach((trip) => {
    tripScores[trip._id] = (tripScores[trip._id] || 0) + 2;
  });

  // User's saved trips, add score 1
  savedTrips.forEach((trip) => {
    tripScores[trip._id] = (tripScores[trip._id] || 0) + 1;
  });

  // Convert the scores object to an array
  const scoredTrips = Object.entries(tripScores).map(([tripId, score]) => ({
    tripId,
    score,
  }));

  // Sort the array by score in descending order
  scoredTrips.sort((a, b) => b.score - a.score);

  return scoredTrips;
}

// async function calculateFollowingInterestScore(userId) {
//   // Find the user with the provided userId
//   const user = await User.findById(userId).populate("followings");

//   if (!user) {
//     throw new Error("User not found");
//   }

//   let tripScores = {};

//   // For each followed user...
//   for (let following of user.followings) {
//     // Populate the followed user's trips, likedTrips and savedTrips
//     await User.populate(following, ["trips", "likedTrips", "savedTrips"]);

//     // Followed user's trips, add score 2
//     following.trips.forEach((trip) => {
//       tripScores[trip._id] = (tripScores[trip._id] || 0) + 2;
//     });

//     // Followed user's liked trips, add score 1.5
//     following.likedTrips.forEach((trip) => {
//       tripScores[trip._id] = (tripScores[trip._id] || 0) + 1.5;
//     });

//     // Followed user's saved trips, add score 1
//     following.savedTrips.forEach((trip) => {
//       tripScores[trip._id] = (tripScores[trip._id] || 0) + 1;
//     });
//   }

//   // Convert the scores object to an array
//   const scoredTrips = Object.entries(tripScores).map(([tripId, score]) => ({
//     tripId,
//     score,
//   }));

//   // Sort the array by score in descending order
//   scoredTrips.sort((a, b) => b.score - a.score);

//   return scoredTrips;
// }

async function calculateFollowingInterestScore(userId) {
  // Find the user with the provided userId
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  let tripScores = {};

  // Keep only the last 3 followings
  const recentFollowings = user.followings.slice(-3);

  // For each user the main user is following
  for (let following of recentFollowings) {
    // Find the user being followed
    const followedUser = await User.findById(following);

    // User's trips, add score 2
    followedUser.trips.slice(-3).forEach((trip) => {
      tripScores[trip._id] = (tripScores[trip._id] || 0) + 2;
    });

    // User's liked trips, add score 1
    followedUser.likedTrips.slice(-3).forEach((trip) => {
      tripScores[trip._id] = (tripScores[trip._id] || 0) + 1;
    });
  }

  // Convert the scores object to an array
  const scoredTrips = Object.entries(tripScores).map(([tripId, score]) => ({
    tripId,
    score,
  }));

  // Sort the array by score in descending order
  scoredTrips.sort((a, b) => b.score - a.score);

  return scoredTrips;
}

// async function calculateInterestScore(userId) {
//   // Find the user with the provided userId
//   const user = await User.findById(userId)
//     .populate("interestedInTrips")
//     .populate("interestedInProfiles")
//     .populate("interestedInHashtags");

//   if (!user) {
//     throw new Error("User not found");
//   }

//   let tripScores = {};

//   // User's interestedInTrips, add score 5
//   user.interestedInTrips.forEach((trip) => {
//     tripScores[trip._id] = (tripScores[trip._id] || 0) + 5;
//   });

//   // Trips from interestedInProfiles, add score 4
//   for (let profile of user.interestedInProfiles) {
//     const profileTrips = await Trip.find({ owner: profile._id });
//     profileTrips.forEach((trip) => {
//       tripScores[trip._id] = (tripScores[trip._id] || 0) + 4;
//     });
//   }

//   // Trips with interestedInHashtags, add score 3
//   for (let hashtag of user.interestedInHashtags) {
//     const hashtagTrips = await Trip.find({ hashtags: hashtag._id });
//     hashtagTrips.forEach((trip) => {
//       tripScores[trip._id] = (tripScores[trip._id] || 0) + 3;
//     });
//   }

//   // Convert the scores object to an array
//   const scoredTrips = Object.entries(tripScores).map(([tripId, score]) => ({
//     tripId,
//     score,
//   }));

//   // Sort the array by score in descending order
//   scoredTrips.sort((a, b) => b.score - a.score);

//   return scoredTrips;
// }

async function calculateInterestScore(userId) {
  // Find the user with the provided userId
  const user = await User.findById(userId)
    .populate("interestedInTrips")
    .populate("interestedInProfiles")
    .populate("interestedInHashtags");

  if (!user) {
    throw new Error("User not found");
  }

  let tripScores = {};

  // User's interestedInTrips, add score 5
  user.interestedInTrips.slice(-3).forEach((trip) => {
    tripScores[trip._id] = (tripScores[trip._id] || 0) + 5;
  });

  // Trips from interestedInProfiles, add score 4
  for (let profile of user.interestedInProfiles.slice(-3)) {
    const profileTrips = await Trip.find({ owner: profile._id });
    profileTrips.slice(-3).forEach((trip) => {
      tripScores[trip._id] = (tripScores[trip._id] || 0) + 4;
    });
  }

  // Trips with interestedInHashtags, add score 3
  for (let hashtag of user.interestedInHashtags.slice(-3)) {
    const hashtagTrips = await Trip.find({ hashtags: hashtag._id });
    hashtagTrips.slice(-3).forEach((trip) => {
      tripScores[trip._id] = (tripScores[trip._id] || 0) + 3;
    });
  }

  // Convert the scores object to an array
  const scoredTrips = Object.entries(tripScores).map(([tripId, score]) => ({
    tripId,
    score,
  }));

  // Sort the array by score in descending order
  scoredTrips.sort((a, b) => b.score - a.score);

  return scoredTrips;
}

// exports.getAllTrips = async (req, res, next) => {
//   try {
//     let page = parseInt(req.query.page) || 1;
//     const pageSize = 10;
//     const skip = (page - 1) * pageSize;

//     const userInterestScores = await calculateUserInterestScore(req.user._id);
//     const followingInterestScores = await calculateFollowingInterestScore(
//       req.user._id
//     );
//     const interestScores = await calculateInterestScore(req.user._id);
//     console.log(interestScores);
//     // Combine and sort the scores
//     let combinedScores = [
//       ...userInterestScores,
//       ...followingInterestScores,
//       ...interestScores,
//     ];
//     combinedScores.sort((a, b) => b.score - a.score);

//     // Extract trip IDs for the current page
//     const currentPageTripIds = combinedScores
//       .slice(skip, skip + pageSize)
//       .map((score) => new mongoose.Types.ObjectId(score.tripId));

//     // Fetch the actual trips for the current page
//     const trips = await Trip.find({ _id: { $in: currentPageTripIds } });

//     return res.status(200).json(trips);
//   } catch (error) {
//     return next(error);
//   }
// };

// exports.getAllTrips = async (req, res, next) => {
//   try {
//     const trips = await Trip.find();
//     return res.status(200).json(trips);
//   } catch (error) {
//     return next(error);
//   }
// };

exports.getAllTrips = async (req, res, next) => {
  try {
    const pageSize = 18;

    // Calculate scores
    const userScores = await calculateUserInterestScore(req.user._id);
    const followingScores = await calculateFollowingInterestScore(req.user._id);
    const interestScores = await calculateInterestScore(req.user._id);

    // Get top tripIds from each scoring function
    const topUserTripIds = userScores
      .slice(0, pageSize)
      .map((score) => score.tripId);
    const topFollowingTripIds = followingScores
      .slice(0, pageSize)
      .map((score) => score.tripId);
    const topInterestTripIds = interestScores
      .slice(0, pageSize)
      .map((score) => score.tripId);
    let trips;
    // Combine all top tripIds and remove duplicates
    const currentPageTripIds = [
      ...new Set([
        ...topUserTripIds,
        ...topFollowingTripIds,
        ...topInterestTripIds,
      ]),
    ];
    trips = await Trip.find({ _id: { $in: currentPageTripIds } });

    if (trips.length < pageSize) {
      const remainingTripsCount = pageSize - trips.length;

      // Get remainingTripsCount random trips that are not in currentPageTripIds
      const randomTrips = await Trip.aggregate([
        { $match: { _id: { $nin: trips.map((trip) => trip._id) } } },
        { $sample: { size: remainingTripsCount } },
      ]);
      trips = [...trips,...randomTrips]
    }
    console.log(trips.length);
    // Sort the trips by their scores
    trips.sort((a, b) => {
      const scoreA =
        userScores.find((score) => score.tripId === a._id)?.score ||
        0 + followingScores.find((score) => score.tripId === a._id)?.score ||
        0 + interestScores.find((score) => score.tripId === a._id)?.score ||
        0;

      const scoreB =
        userScores.find((score) => score.tripId === b._id)?.score ||
        0 + followingScores.find((score) => score.tripId === b._id)?.score ||
        0 + interestScores.find((score) => score.tripId === b._id)?.score ||
        0;

      return scoreB - scoreA;
    });

    return res.status(200).json(trips);
  } catch (error) {
    return next(error);
  }
};
