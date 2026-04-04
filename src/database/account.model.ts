import mongoose from "mongoose";

export type EmployeeType = "part-time" | "full-time" | "volunteer"

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
    unique: true
  },
  sessions: {
    type: [String]
  },
  employeeId: {
    type: String,
    require: true,
    unique: true
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    require: true
  },
  dateOfBirth: {
    type: Date,
    require: true
  },
  dateOfJoining: {
    type: Date,
    require: true
  },
  employeeType: {
    type: String,
    enum: ["full-time", "part-time", "volunteer"],
    default: "full-time",
  },
  phoneNumber: {
    type: String,
    require: true
  },
  secondaryPhoneNumber: {
    type: String,
  },
  address: {
    type: String,
    require: true
  },
  department: {
    type: String,
    require: true
  },
  designation: {
    type: String,
    require: true
  },
  salaryStructure: {
    type: String,
    require: true
  },
  bankDetail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BankDetail"
  },
  aadhar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Media"
  },
  pan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Media"
  },
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Media"
  },
}, { timestamps: true })

export type AccountType = mongoose.InferSchemaType<typeof accountSchema>
export const Account = mongoose.model<AccountType>("Account", accountSchema)

