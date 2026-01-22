import mongoose from "mongoose";

const bankDetailSchema = new mongoose.Schema({
  accountHolderName: {
    type: String,
    require: true
  },
  bankName: {
    type: String,
    require: true
  },
  branch: {
    type: String,
    require: true
  },
  ifcs: {
    type: String,
    require: true
  },
  mobileNumber: {
    type: String,
    require: true
  },
}, { timestamps: true })

export type BankDetailType = mongoose.InferSchemaType<typeof bankDetailSchema>

export const BankDetail = mongoose.model("BankDetail", bankDetailSchema) 
