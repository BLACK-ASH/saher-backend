
import { Router } from "express"
import { Attendence } from "../database/attendence.model.js"
import { User } from "../database/user.model.js"



const attendenceRouter = Router()

attendenceRouter.post("/", async (req, res) => {
    const {email} = req.body
    try {
        const userID = await User.findOne({email})
    console.log(userID?._id);
        
        const newRecord = await Attendence.create({
            user : userID?._id,
            status:"present"
        })
        return res.status(201).json({message:"You have been marked present",success: true})

    } catch (error) {
        console.log(error);
        return res.status(404).json({message:"There was some error", success: false})
        
    }
})
    
export default attendenceRouter