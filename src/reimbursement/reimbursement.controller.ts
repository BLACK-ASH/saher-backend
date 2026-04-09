import { ApiError } from "../libs/class/api-error.js"


// 1st controller --> Apply for reimbursement ((For User , admin , manager) protected Route)-POST request 
// steps : Check if the id for given for the bill  and the user is already present in the reimbursement model or not 
        // if present throw ApiError

        // else create the record in reimbursement Schema 

        // Return res 



//2nd Controller --> Review the reimbursement ( For Admin and manager  - protected Route ) -PUT request 
//Steps : you will get the ID for the reimbursment record in the params , then validate the id by finding it in the reimbursment model 
        // if not found throw ApiError

        // else  get the status from req.body 
        // and update the record 
        

// 3rd Controller --> Get your reimbursement ( for user , admin , manager - protected route ) - GET req 
// Steps : Just search te record if not found throw apiError 





// 4th Controller --> Get All reimbursement ( for admin , manager - protected route ) - GET req 
// Steps : check if user is admin/manager , if not throw ApiError 

        // else fetch the entire table and send the table in res 
        