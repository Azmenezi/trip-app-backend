const express = require("express");
const router = express.Router();
const passport = require("passport");

const { fetchTrip, deleteTrip } = require("./controllers");

router.param("tripId", async (req, res, next, tripId) => {
  try {
    const trip = await fetchTrip(tripId);
    if (!trip) return next({ status: 404, message: "trip not found" });
    req.trip = trip;
    next();
  } catch (error) {
    return next(error);
  }
});

router.delete(
  "/delete/:tripId",
  passport.authenticate("jwt", { session: false }),
  deleteTrip
);
module.exports = router;
