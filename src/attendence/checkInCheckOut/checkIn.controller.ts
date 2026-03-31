import { Request,Response } from "express"

import { Attendence } from "../../database/attendence.model.js"


export const checkInController = async(req:Request,res:Response)=>{

    //Step 1 - Check if the user has token or not   
   
    const user= await req.user
    
    if (!user) {
        return res.status(404).json({ message: "User not found", success: false })
    }

    const today = new Date()
    today.setHours(0,0,0,0)

    //Step 2 - Check karo ki user ne pehle se aaj ki attendence toh nahi mark kari hai 
    const existingRecord = await Attendence.findOne({
        user : user?.id,
        createdAt : {$gte : today}
    })

    //Step 3 - Agr haa toh oosko dubara attendence mark karne mat do 
    if (existingRecord){
        return res.status(400).json({message : "You have already marked your attendence"})
    }


    //Step 5 - if User exist and have not submitted today's attendence start making new entry 
    try {
        //Step6 - Note the current time so that late hai ki nahi ka pata chal sake 
        const currentTime = new Date()
        const expectedTime = new Date()
        //Abhi ke liye aise hii hardcore data liya hai 
        expectedTime.setHours(9, 0, 0, 0)
        const halfDaytiming = new Date()
        halfDaytiming.setHours(11,0,0,0)

        let status 
        if (currentTime > halfDaytiming){
             status = "half-day"
           
        }else{
            status = "present"
            
        }
        console.log(status);
        
        console.log(user?.id);

        const newRecord = await Attendence.create({
            user: user.id,
            inTime : currentTime ,
            status: status,
            Date : today,
            isLate : currentTime > expectedTime
        })
        return res.status(200).json({ message: "You have been marked present", success: true })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false })

    }
}
