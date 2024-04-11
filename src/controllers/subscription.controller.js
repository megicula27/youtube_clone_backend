import { AsyncHandler } from "../utils/AsyncHandler.utils.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { ErrorHandler } from "../utils/ErrorHandler.utils.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

//correct
const toggleSubscription = AsyncHandler(async (req, res) => {
  try {
    const channelId = req.params.channelId;
    const userId = req.user._id;

    // Fetch user and channel
    const user = await User.findById(userId).select("-password -refreshToken"); // one who is subscribing
    const channel = await User.findOne({ _id: channelId }).select(
      "-password -refreshToken"
    );
    // who is getting subscribed
    // write error handlers
    if (!user || !channel) {
      return res
        .status(404)
        .json(new ApiResponse(404, "User or channel not found"));
    }

    // Check if subscription exists
    const toggle = await Subscription.findOne({
      channel: channel._id,
      subscriber: user._id,
    });

    let subscription;
    if (!toggle) {
      // If subscription does not exist, create a new one
      subscription = await Subscription.create({
        subscriber: user._id,
        channel: channel._id,
      });
    } else {
      // If subscription exists, unsubscribe
      await Subscription.findByIdAndDelete(toggle._id);
      subscription = null; // Set subscription to null since it's now unsubscribed
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Toggled subscription status", subscription));
  } catch (error) {
    // Handle errors
    throw new ErrorHandler(500, "error in toggeling the subscription", error);
  }
});
//correc
const getUserChannelSubscribers = AsyncHandler(async (req, res) => {
  try {
    const subscriberId = req.params.subscriberId;

    const matchStage = { _id: new mongoose.Types.ObjectId(subscriberId) };

    console.log("match stage", matchStage);
    const lookupStage = {
      from: "subscriptions",
      localField: "_id",
      foreignField: "channel",
      as: "subscribers",
    };

    const projectStage = {
      userName: 1,
      fullName: 1,
      avatar: 1,
      subscribers: 1,
    };
    const user = await User.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: lookupStage,
      },

      {
        $project: projectStage,
      },
    ]);

    if (!user || !user.length) {
      // If user not found or empty array returned
      return res.status(404).json(new ApiResponse(404, "User not found"));
    }

    // Returning subscribers data along with the response
    return res
      .status(200)
      .json(new ApiResponse(200, "Subscribers fetched successfully", user[0])); // console log karke dekhna hai yahan user
  } catch (error) {
    // Handle errors
    throw new ErrorHandler(400, "Error while fetching subscribers", error);
  }
});
//correct
const getSubscribedChannels = AsyncHandler(async (req, res) => {
  const channelId = req.params.channelId;
  const matchStage = {
    _id: new mongoose.Types.ObjectId(channelId),
  };

  const lookupStage = {
    from: "subscriptions",
    localField: "_id",
    foreignField: "subscriber",
    as: "subscribedChannel",
  };

  try {
    const user = await User.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: lookupStage,
      },

      {
        $project: {
          userName: 1,
          fullName: 1,
          avatar: 1,
          subscribedChannel: 1,
        },
      },
    ]);

    if (!user || user.length === 0) {
      // If user not found or empty array returned
      return res.status(404).json(new ApiResponse(404, "User not found"));
    }
    console.log(user);
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Subscribed channels fetched successfully", user)
      );
  } catch (error) {
    throw new ErrorHandler(
      400,
      "Error while fetching subscribed channels",
      error
    );
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
