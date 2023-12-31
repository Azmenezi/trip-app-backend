const { model, Schema } = require("mongoose");
// Everything with the word temp is a placeholder that you'll change in accordance with your project

const TripSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    image: { type: String, required: true },
    creator: { type: Schema.Types.ObjectId, ref: "User" },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    hashtags: [{ type: Schema.Types.ObjectId, ref: "Hashtag" }],
    // create relations in here and in the other model
  },
  { timestamps: true }
);

module.exports = model("Trip", TripSchema);
