import "express";

declare global {
  namespace Express {
    interface Request {
      fileValidationError?: string;
      user?:{
        id:string,
        name:string,
        role:string
      }
    }
  }
}
