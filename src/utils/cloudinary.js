import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//const localPath = './public'
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfull
    //console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};
const deleteFromCloudinary = async (publicId) => {
  try {
    // Delete the file from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Deleted file from Cloudinary:", result);
    return result;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw error;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };