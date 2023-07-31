const Hashtag = require("../../models/Hashtag");

exports.getAllHashtags = async (req, res, next) => {
  try {
    const hashtags = await Hashtag.find().select("-__v -trips");
    return res.status(200).json(hashtags);
  } catch (error) {
    return next(error);
  }
};
// exports.getHashtagByName = async (req, res, next) => {
//   try {
//     const { name } = req.params;
//     console.log(name);
//     const hashtag = await Hashtag.findOne({ name: name }).populate(
//       "trips",
//       "image _id"
//     );

//     if (!hashtag) {
//       return res.status(404).json({ message: "Hashtag not found" });
//     }

//     await req.user.updateOne({ $push: { interestedInHashtags: hashtag._id } });

//     return res.status(200).json(hashtag);
//   } catch (error) {
//     return next(error);
//   }
// };

exports.getHashtagByName = async (req, res, next) => {
  try {
    const { name } = req.params;
    const hashtag = await Hashtag.findOne({ name: name }).populate(
      "trips",
      "image _id"
    );

    if (!hashtag) {
      return res.status(404).json({ message: "Hashtag not found" });
    }

    let interestedHashtags = req.user.interestedInHashtags;

    // Check if the hashtag._id is already in the interestedInHashtags array
    const index = interestedHashtags.indexOf(hashtag._id);
    if (index > -1) {
      // Remove it
      interestedHashtags.splice(index, 1);
    }

    // Check if the length has reached 20
    if (interestedHashtags.length >= 20) {
      // Remove the oldest one
      interestedHashtags.shift();
    }

    // Add the new hashtag._id to the end of the array
    interestedHashtags.push(hashtag._id);

    // Update the user document
    await req.user.updateOne({ interestedInHashtags: interestedHashtags });

    return res.status(200).json(hashtag);
  } catch (error) {
    return next(error);
  }
};
