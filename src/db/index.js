import mongoose from "mongoose";

const connection = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "videoBackend",
    });
    console.log("Mongo Db connected");
  } catch (err) {
    console.log("mongoDb connection failed ", err);
  }
};

export { connection };
