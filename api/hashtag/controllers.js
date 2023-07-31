const Hashtag = require("../../models/Hashtag");

exports.getAllHashtags = async (req, res, next) => {
  try {
    const hashtags = await Hashtag.find().select("-__v -trips");
    return res.status(200).json(hashtags);
  } catch (error) {
    return next(error);
  }
};
exports.getHashtagByName = async (req, res, next) => {
  try {
    const { name } = req.params;
    console.log(name);
    const hashtag = await Hashtag.findOne({ name: name }).populate(
      "trips",
      "image _id"
    );

    if (!hashtag) {
      return res.status(404).json({ message: "Hashtag not found" });
    }

    await req.user.updateOne({ $push: { interestedInHashtags: hashtag._id } });

    return res.status(200).json(hashtag);
  } catch (error) {
    return next(error);
  }
};
