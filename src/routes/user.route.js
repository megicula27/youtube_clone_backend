import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  getUserChannelProfile,
  getWatchHistory,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middle.js";
import { auth } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(auth, logoutUser);
router.route("/refresh-token").post(auth, refreshAccessToken);
router.route("/change-password").post(auth, changeCurrentPassword);
router.route("/get-user").get(auth, getCurrentUser);
router.route("/update-user-details").patch(auth, updateAccountDetails);
router
  .route("/update-avatar")
  .patch(auth, upload.single("avatar"), updateUserAvatar);
router
  .route("/update-cover-image")
  .patch(auth, upload.single("coverImage"), updateUserCoverImage);
router.route("/channel/:userName").get(auth, getUserChannelProfile);
router.route("/history").get(auth, getWatchHistory);
export default router;
