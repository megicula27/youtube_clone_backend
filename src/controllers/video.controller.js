import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { ErrorHandler } from "../utils/ErrorHandler.utils.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { AsyncHandler } from "../utils/AsyncHandler.utils.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";

// !! HANDLE ALL CORNER CASES FOR ERRORS
// logic for get all videos

//correct
const getAllVideos = AsyncHandler(async (req, res) => {
  try {
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    sortBy = sortBy || "date";
    sortType = sortType || "desc";
    // userId = "";
    const matchStage = userId
      ? { owner: new mongoose.Types.ObjectId(userId) }
      : {};

    if (query) {
      matchStage.$or = [
        {
          title: {
            $regex: query,
            $options: "i",
          },
        },
        {
          description: {
            $regex: query,
            $options: "i",
          },
        },
      ];
    }
    console.log(matchStage);
    const sortStage = {};
    sortStage[sortBy] = sortType === "desc" ? -1 : 1;

    const pipeline = [
      { $match: matchStage },
      { $sort: sortStage },
      { $skip: (page - 1) * limit }, // Use limit instead of hardcoding 10
      { $limit: limit },
    ];

    const videos = await Video.aggregate(pipeline);
    const totalCount = await Video.countDocuments(matchStage);
    const totalPages = Math.ceil(totalCount / limit); // Calculate totalPages

    return res.status(200).json({
      status: 200,
      message: "Videos fetched successfully",
      data: videos,
      pagination: {
        page,
        limit,
        totalPages, // Use totalPages instead of undefined variable pages
        totalCount,
      },
    });
  } catch (error) {
    throw new ErrorHandler(
      400,
      "Something went wrong while fetching the videos",
      error
    );
  }
});

//correct
const publishAVideo = AsyncHandler(async (req, res) => {
  try {
    const { title, description } = req.body;
    const videoPath = req.files?.videoFile[0].path;
    const thumbnailPath = req.files?.thumbnail[0].path;

    // Validate incoming data
    if (!title || !description || !videoPath || !thumbnailPath) {
      throw new ErrorHandler(400, "Missing required data");
    }

    // Upload video and thumbnail to Cloudinary
    const video = await uploadOnCloudinary(videoPath);
    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    // Create the video
    const newVideo = await Video.create({
      title,
      description,
      videoFile: { url: video.url, publicId: video.public_id },
      thumbnail: { url: thumbnail.url, publicId: thumbnail.public_id },
      duration: "5",
      isPublished: true,
      owner: req.user,
    });

    // Check if video creation was successful
    if (!newVideo) {
      throw new ErrorHandler(400, "Failed to create video");
    }

    // No need to fetch the video again, use newVideo directly

    return res
      .status(200)
      .json(new ApiResponse(200, "Video Created Successfully"));
  } catch (error) {
    // Handle errors
    throw new ErrorHandler(400, "Failed to publish video", error);
  }
});

//correct
const getVideoById = AsyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const user = req.user;
    // Validate videoId
    if (!videoId) {
      throw new ErrorHandler(400, "Video ID is required");
    }

    // Retrieve video by ID
    const video = await Video.findById(videoId);

    // Check if video exists
    if (!video) {
      // If video not found
      return res.status(404).json(new ApiResponse(404, "Video not found"));
    }
    user.watchHistory.push(video);
    await user.save({ validationBeforeSave: false });
    // Return the video
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Video fetched successfully", video.videoFile)
      );
  } catch (error) {
    // Handle errors
    throw new ErrorHandler(500, "Error while fetching video by ID", error);
  }
});

//mostly correct...update: not correct ..had to correct..
const updateVideo = AsyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnailPath = req.file?.path;

    // Check if videoId is provided
    if (!videoId) {
      throw new ErrorHandler(400, "Video ID is required");
    }

    // Check if title and description are provided
    if (!title || !description) {
      throw new ErrorHandler(400, "Title and description are required");
    }

    let thumbnailUrl;
    let thumbnailId;
    // Upload thumbnail to Cloudinary if path is provided
    if (thumbnailPath) {
      const thumbUploadResponse = await uploadOnCloudinary(thumbnailPath);
      thumbnailUrl = thumbUploadResponse.url;
      thumbnailId = thumbUploadResponse.public_id;
    }

    // Update video details
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title,
          description,
          thumbnail: { url: thumbnailUrl, publicId: thumbnailId }, // Set thumbnailUrl if available, otherwise undefined
        },
      },
      {
        new: true, // Return the updated document
      }
    );

    // Check if video exists
    if (!updatedVideo) {
      throw new ErrorHandler(404, "Video not found");
    }

    // Return success response with updated video details
    return res.status(200).json({
      status: 200,
      message: "Video details updated successfully",
      data: updatedVideo,
    });
  } catch (error) {
    // Handle errors
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || "Failed to update video details",
      error
    );
  }
});

//delete the video from the cloudinary
//correct
const deleteVideo = AsyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    // Find the video to get the thumbnail URL
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json(new ApiResponse(404, "Video not found"));
    }

    // Delete the video from Cloudinary
    await deleteFromCloudinary(video.videoFile.publicId); // Assuming thumbnail is the Cloudinary URL
    await deleteFromCloudinary(video.thumbnail.publicId);
    // Delete the video from the database
    await Video.findByIdAndDelete(videoId);

    return res
      .status(200)
      .json(new ApiResponse(200, "Video deleted successfully"));
  } catch (error) {
    throw new ErrorHandler(400, "Failed to delete video", error);
  }
});
//correct
const togglePublishStatus = AsyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    // Retrieve the current status of isPublished for the video
    const video = await Video.findById(videoId);

    // If the video is not found, return an error
    if (!video) {
      return res.status(404).json(new ApiResponse(404, "Video not found"));
    }

    // Toggle the isPublished status
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          isPublished: !video.isPublished, // Toggle the status based on the current value
        },
      },
      { new: true }
    ).select("title description isPublished"); // To return the updated document

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Publish status toggled successfully",
          updatedVideo
        )
      );
  } catch (error) {
    throw new ErrorHandler(400, "Failed to toggle publish status", error);
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
