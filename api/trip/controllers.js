const express = require("express");

exports.deleteTrip = async (req, res, next) => {
  try {
    console.log(req.user._id, req.trip.creator);
    if (!req.user._id.equals(req.tripe.creator))
      return next({
        status: 401,
        message: "You can not delete other persons trip",
      });

    await req.trip.deleteOne();
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
};
