import mongoose from 'mongoose';

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    // WARN:Remove This After Development
    // eslint-disable-next-line no-console
    console.log('Database Connected.');
  } catch (error) {
    console.error(error);
    process.exit();
  }
};

export default connectDb;
