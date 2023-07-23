const { model, Schema } = require("mongoose");
// Everything with the word temp is a placeholder that you'll change in accordance with your project

const TripSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String, required: true },
  creator: { type: Schema.Types.ObjectId, ref: "User" },

  // create relations in here and in the other model
});

module.exports = model("Trip", TripSchema);
