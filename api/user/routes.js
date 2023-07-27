const express = require("express");
const {
  createUser,
  updateUser,
  deleteUser,
  fetchUser,
  signin,
  getUsers,
  getProfile,
  getMyProfile,
} = require("./controllers");
const router = express.Router();
const passport = require("passport");
const upload = require("../../middlewares/multer");
const {
  usernameValidator,
  passwordValidator,
  inputValidator,
  FieldValidation,
} = require("../../middlewares/userValidation");
// Everything with the word user is a placeholder that you'll change in accordance with your project

router.param("userId", async (req, res, next, userId) => {
  try {
    const foundUser = await fetchUser(userId);
    if (!foundUser) return next({ status: 404, message: "User not found" });
    req.foundUser = foundUser;
    next();
  } catch (error) {
    return next(error);
  }
});

router.get("/", passport.authenticate("jwt", { session: false }), getUsers);
router.get(
  "/:userId",
  passport.authenticate("jwt", { session: false }),
  getProfile
);
router.post(
  "/my-profile",
  passport.authenticate("jwt", { session: false }),
  getMyProfile
);
router.post(
  "/register",
  upload.single("image"),
  inputValidator([...usernameValidator, ...passwordValidator], true),
  FieldValidation,
  createUser
);
router.post(
  "/sign-in",
  passport.authenticate("local", { session: false }),

  signin
);
router.put(
  "/:userId",
  passport.authenticate("jwt", upload.single("image"), { session: false }),
  updateUser
);
router.delete(
  "/:userId",
  passport.authenticate("jwt", { session: false }),
  deleteUser
);

module.exports = router;
