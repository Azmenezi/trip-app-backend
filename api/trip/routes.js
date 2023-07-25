const express = require("express");
const router = express.Router();
const passport = require("passport");


const { fetchTrip,  addTrip,deleteTrip, getAllTrips } = require("./controllers");
const upload = require("../../middlewares/multer");


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

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  upload.single("image"),
  addTrip
);

router.delete(
  "/delete/:tripId",
  passport.authenticate("jwt", { session: false }),
  deleteTrip
);

router.get(
  "/gettrips",
  passport.authenticate("jwt", { session: false }),
  getAllTrips
);
module.exports = router;
