import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();

router.use(auth);

router
  .route("/channel/:channelId")
  .get(getSubscribedChannels)
  .post(toggleSubscription);
router.route("/user/:subscriberId").get(getUserChannelSubscribers);

export default router;
