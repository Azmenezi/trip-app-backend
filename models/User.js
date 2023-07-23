const { model, Schema } = require("mongoose");
// Everything with the word temp is a placeholder that you'll change in accordance with your project

const UserSchema = new Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  trips: [{ type: Schema.Types.ObjectId, ref: "Trip" }],
  // create relations in here and in the other model
});

module.exports = model("User", UserSchema);
