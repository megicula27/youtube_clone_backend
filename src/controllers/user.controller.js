import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { AsyncHandler } from "../utils/AsyncHandler.utils.js";
import { ErrorHandler } from "../utils/ErrorHandler.utils.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
const getAccessTokenAndRefreshToken = async (id) => {
  try {
    const user = await User.findById(id);

    const accessToken = user.getAccessToken();
    const refreshToken = user.getRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ErrorHandler(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};
//correct
export const registerUser = AsyncHandler(async (req, res) => {
  // GET THE REQUIRED INFO FROM FRONTEND
  // CHECK FOR VALIDATIONS
  // CHECK IF USER ALREADY EXISTS
  // CHECK FOR AVATAR AND COVER IMAGE AS WE ARE GOING TO UPLOAD THEM ON CLOUDINARY
  // REGISTER/CREATE THE USER IN THE DB
  // REMOVE THE PASSWORD AND REFRESH TOKEN FROM THE RESPONSE
  // CHECK IF USER IF REGISTERED
  // RETURN RESPONSE

  const { userName, fullName, email, password } = req.body;

  if (
    [userName, fullName, email, password].some((field) => field?.trim === "")
  ) {
    throw new ErrorHandler(400, "all fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existingUser) {
    throw new ErrorHandler(400, "user already exists");
  }

  // console.log('req.files for avatar and coverimage:', req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImaagePath = req.files?.coverImage[0]?.path;
  let coverImagePath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagePath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ErrorHandler(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImagePath);

  if (!avatar) {
    throw new ErrorHandler(400, "Avatar is required");
  }

  const user = await User.create({
    userName: userName.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ErrorHandler(500, "User not registered");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered successfully"));
});
//correct
export const loginUser = AsyncHandler(async (req, res) => {
  //get user details from req.body or frontend
  // check if fields are valid.... username or email
  // check if user exists
  //password check
  //get refresh and access token
  // set cookies

  const { email, userName, password } = req.body;
  if (!email && !userName) {
    throw new ErrorHandler(400, "Email or username required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ErrorHandler(400, "User doesn't exists, please register");
  }

  const userPassword = await user.isPasswordCorrect(password);

  if (!userPassword) {
    throw new ErrorHandler(400, "Wrong Credentials");
  }

  const { accessToken, refreshToken } = await getAccessTokenAndRefreshToken(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, "logged in successfully"));
});
//correct
export const logoutUser = AsyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      refreshToken: null,
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged out successfully"));
});
//correct
export const refreshAccessToken = AsyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!oldRefreshToken) {
    throw new ErrorHandler(401, "Unauthorised request");
  }

  try {
    const decodedToken = jwt.verify(
      oldRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const id = decodedToken?._id;

    const user = await User.findById(id).select("-password");

    if (oldRefreshToken !== user?.refreshToken) {
      throw new ErrorHandler(400, "Refresh Token has expired or used");
    }

    const { accessToken, refreshToken } = await getAccessTokenAndRefreshToken(
      id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(new ApiResponse(200, "new Token Generated"));
  } catch (error) {
    throw new ErrorHandler(
      400,
      error?.message || "something went wrong in storing token"
    );
  }
});
//correct
export const changeCurrentPassword = AsyncHandler(async (req, res) => {
  const { newPassword, oldPassword } = req.body;
  const user = await User.findById(req.user._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  console.log(user);

  if (!isPasswordCorrect) {
    throw new ErrorHandler(400, "wrong old password");
  }
  if (newPassword === oldPassword) {
    throw new ErrorHandler(400, "the new password cannot be the old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  //   await User.findByIdAndUpdate(user._id ,
  //     {
  //     $set : {
  //       password : newPassword
  //     }
  //   },
  //   {
  //     new : true
  //   }
  // )

  return res
    .status(200)
    .json(new ApiResponse(200, "password changed successfully"));
});
//correct
export const getCurrentUser = AsyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "user fetched successully", req.user));
});
//correct
export const updateAccountDetails = AsyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ErrorHandler(400, "All fields are mandatory");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "User data updated successully", user));
});
//correct
export const updateUserAvatar = AsyncHandler(async (req, res) => {
  const avatarPath = req.file?.path;
  if (!avatarPath) {
    throw new ErrorHandler(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarPath);
  if (!avatar.url) {
    throw new ErrorHandler(400, "Avatar upload failed on cloudinary");
  }
  const user = await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar image updated successully", user));
});
//correct
export const updateUserCoverImage = AsyncHandler(async (req, res) => {
  const coverImagePath = req.file?.path;
  if (!coverImagePath) {
    throw new ErrorHandler(400, "Avatar file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImagePath);
  if (!coverImage.url) {
    throw new ErrorHandler(400, "Avatar upload failed on cloudinary");
  }
  const user = await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "Cover Image updated successully", user));
});
//correct
export const getUserChannelProfile = AsyncHandler(async (req, res) => {
  const userName = req.params.userName;
  console.log(userName);
  if (!userName) {
    throw new ErrorHandler(400, "User Name is required");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName,
      },
    },

    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersSize: {
          $size: "$subscribers",
        },
        subscribedToSize: {
          $size: "$subscribedTo",
        },
      },
    },

    {
      $project: {
        userName: 1,
        fullName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,

        subscribers: 1,
        subscribersSize: 1,
        subscribedTo: 1,
        subscribedToSize: 1,
        isSubscribed: {
          $cond: {
            if: {
              $in: [req?.user._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel, "User channel fetched successfully"));
});
//correct
export const getWatchHistory = AsyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    userName: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    //console karke dekhna hai bina $first ke kya result aata hai

    {
      $project: {
        userName: 1,
        fullName: 1,
        avatar: 1,
        watchHistory: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Watch history fetched successfully"));
});
