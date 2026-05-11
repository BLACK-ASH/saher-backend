import type { Request, Response } from 'express';

import { Bank } from '../../database/bank.model.js';
import { ApiResponse } from '../../libs/class/api-response.js';


// Create Bank Controller
export const createBankDetailController = async (req: Request, res: Response) => {
  const { accountHolderName, bankName, ifcs, branch, mobileNumber } = req.body;

  try {
    const details = await Bank.create({ accountHolderName, bankName, ifcs, branch, mobileNumber });
    return ApiResponse.success(res, {
      message: 'Bank Details Added Succesfull',
      data: details,
      statusCode: 201,
    });
  } catch (error) {
    console.error(error);
    return ApiResponse.success(res, {
      message: 'Registration failed',
      data: error,
      statusCode: 500,
    });
  }
};

// Get Bank Controller
export const getBankDetailController = async (req: Request, res: Response) => {
  const id = req.body._id || req.body.id;

  try {
    const details = await Bank.findById(id);

    if (!details) {
      return ApiResponse.success(res, {
        message: 'Bank Details Not Exist',
        data: null,
        statusCode: 200,
      });
    }

    return ApiResponse.success(res, {
      message: 'Bank Details Retrive Succesfully',
      data: details,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    return ApiResponse.success(res, {
      message: 'Getting Data failed',
      data: error,
      statusCode: 500,
    });
  }
};

// Update Bank Controller
export const updateBankDetailController = async (req: Request, res: Response) => {
  const { id, data } = req.body;

  try {
    const updated = await Bank.findByIdAndUpdate(id, data);

    if (!updated) {
      return ApiResponse.success(res, {
        message: 'Bank Details Not Exist',
        data: null,
        statusCode: 200,
      });
    }

    return ApiResponse.success(res, {
      message: 'Bank Details Updated Successffully',
      data: updated,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    return ApiResponse.success(res, {
      message: 'Update failed',
      data: error,
      statusCode: 500,
    });
  }
};

// Delete Bank Controller
export const deleteBankDetailController = async (req: Request, res: Response) => {
  const id = req.body._id || req.body.id;

  try {
    const deleted = await Bank.findByIdAndDelete(id);

    if (!deleted) {
      return ApiResponse.success(res, {
        message: 'Bank Details Not Exist',
        data: null,
        statusCode: 200,
      });
    }

    return ApiResponse.success(res, {
      message: 'Bank Details Deleted Succesfully',
      data: deleted,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    return ApiResponse.success(res, {
      message: 'Deletion  failed',
      data: error,
      statusCode: 500,
    });
  }
};
