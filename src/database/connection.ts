import mongoose from "mongoose"

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!)
    console.log("Database Connected.")
  }
  catch (error) {
    console.log(error)
    process.exit()
  }
}

export default connectDb;
