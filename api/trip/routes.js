const express = require("express");
const router = express.Router();
const passport = require("passport");

const { deleteTripe } = require("../trip");

router.delete(
  "/delete/:tripId",
  passport.authenticate("jwt", { session: false }),
  deleteTripe
);
module.exports = router;
