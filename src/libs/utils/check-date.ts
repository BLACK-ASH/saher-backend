
export const isPastDate = (date : Date):boolean=>{
    const today = new Date()
    const inputDate = new Date(date)
    
    return inputDate < today 
}