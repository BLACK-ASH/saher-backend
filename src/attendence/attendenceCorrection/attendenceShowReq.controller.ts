import { User } from "../../database/user.model.js"
import { Request , Response} from "express"


export const showRequestedCorrection = async(req:Request , res:Response)=>{
    const user = await User.findById(req.user?.id)

    if(!user){
        return res.status(400).json({message:"User not found"})
    
    }


    // const requests = await 
}