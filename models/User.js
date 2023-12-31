const { model, Schema } = require("mongoose");
// Everything with the word temp is a placeholder that you'll change in accordance with your project

const UserSchema = new Schema(
  {
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    trips: [{ type: Schema.Types.ObjectId, ref: "Trip" }],
    headerImage: { type: String },
    likedTrips: [{ type: Schema.Types.ObjectId, ref: "Trip" }],
    savedTrips: [{ type: Schema.Types.ObjectId, ref: "Trip" }],
    followings: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    interestedInTrips: [{ type: Schema.Types.ObjectId, ref: "Trip" }],
    interestedInProfiles: [{ type: Schema.Types.ObjectId, ref: "User" }],
    interestedInHashtags: [{ type: Schema.Types.ObjectId, ref: "Hashtag" }],
    // create relations in here and in the other model
  },
  { timestamps: true }
);

module.exports = model("User", UserSchema);
