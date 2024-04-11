import { ErrorHandler } from "../utils/ErrorHandler.utils.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { AsyncHandler } from "../utils/AsyncHandler.utils.js";

export const auth = AsyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken || req.header("Authorizarion")?.("Bearer ", "");

    if (!token) {
      throw new ErrorHandler(401, "Unauthorized access");
    }

    const decodedId = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedId._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ErrorHandler(401, "Invalid access Token");
    }
    req.user = user;

    next();
  } catch (error) {
    throw new ErrorHandler(401, error?.message || "Invalid Access Token");
  }
});
