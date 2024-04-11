import { Router } from "express";
import { upload } from "../middlewares/multer.middle.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(auth);
router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "videoFile", maxCount: 1 },
    ]),
    publishAVideo
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .patch(upload.single("thumbnail"), updateVideo)
  .delete(deleteVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
export default router;
