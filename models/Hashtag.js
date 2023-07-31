const { model, Schema } = require("mongoose");
// Everything with the word temp is a placeholder that you'll change in accordance with your project

const HashtagSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    trips: [{ type: Schema.Types.ObjectId, ref: "Trip" }],
    // create relations in here and in the other model
  },
  { timestamps: true }
);

module.exports = model("Hashtag", HashtagSchema);
