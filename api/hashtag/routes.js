const express = require("express");
const router = express.Router();
const passport = require("passport");
const { getAllHashtags, getHashtagByName } = require("./controllers");

router.get(
  "/by-name/:name",
  passport.authenticate("jwt", { session: false }),
  getHashtagByName
);
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getAllHashtags
);

module.exports = router;
