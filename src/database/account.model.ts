import mongoose from 'mongoose';

export type EmployeeType = 'part-time' | 'full-time' | 'volunteer';

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    dateOfJoining: {
      type: Date,
      required: true,
    },
    employeeType: {
      type: String,
      enum: ['full-time', 'part-time', 'volunteer'],
      default: 'full-time',
    },
    employeeShift: {
      type: String,
      enum: ['shift-1', 'shift-2'],
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    secondaryPhoneNumber: {
      type: String,
    },
    address: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    salaryStructure: {
      type: String,
      required: true,
    },
    bank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bank',
      required: true,
    },
    aadhar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      required: true,
    },
    pan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      required: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      required: true,
    },
  },
  { timestamps: true },
);

export type AccountType = mongoose.InferSchemaType<typeof accountSchema>;
export const Account = mongoose.model<AccountType>('Account', accountSchema);
