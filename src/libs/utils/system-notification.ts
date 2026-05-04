
import mongoose from 'mongoose';
import { Notification } from '../../database/notification.model.js';
import { notificationResponseListSchema, SendNotificationT } from '../../notification/notification.schema.js';
import { createKey, deleteCache, deleteCacheGroup, setCache, setCacheWithGroup } from '../redis/redis-utils.js';
import { ApiError } from '../class/api-error.js';
import { normalizeDoc } from './normailize-doc.js';
import { normalize } from 'node:path';


// export const sendNotification = async (input: SendNotificationT) => {

//   const { user, type, title, description, scope } = input;
//   let finalUser
//   if (scope !== "specific") {
//     finalUser = undefined;
//   }
//   finalUser = user

//   await deleteCacheGroup('notification')

//   const notification = await Notification.create({
//     user: finalUser,
//     type,
//     title,
//     description,
//     scope
//   });
//   return notification
// };

export class systemNotification{
  static async global(input :SendNotificationT ){
     const globalNotificationKey = createKey('notification', 'global')
    const { type, title, description } = input;
    const globalNotification = await Notification.create({
      user : undefined,
      type ,
      title ,
      description , 
      scope : 'global'
    })

await deleteCache(globalNotificationKey)   
 const allNotification = await Notification.find({scope:'global'}).lean()

    const normalized = normalizeDoc(allNotification)
    const parsed = notificationResponseListSchema.parse(normalized)
    await setCache(globalNotificationKey,parsed)
    return true 
  }

  static async role(input :SendNotificationT ){
    const { type, title, description, scope } = input;
    const scopeKey = createKey('notification','scope',scope)
    const roleNotification = await Notification.create({
      user : undefined,
      type ,
      title ,
      description,
      scope 
    })
    
    await deleteCache(scopeKey)
    const allNotification = await Notification.find({scope : scope}).lean()

    const normalaized = normalizeDoc(allNotification) 
    const parsed = notificationResponseListSchema.parse(normalaized)

    await setCache(scopeKey, parsed)
    return true 
  }

  static async specific(input :SendNotificationT ){
    const { user, type, title, description} = input;
    const specificNotification = await Notification.create({
      user : user,
      type ,
      title ,
      description,
      scope : 'specific'
    })
    if(!user){throw Error}
    for (const id of user) {
      const key = createKey('notification','user',id)
      const specificNotification = await Notification.find({user : id }).lean()
      const normalaized = normalizeDoc(specificNotification)
      const parsed = notificationResponseListSchema.parse(normalaized)

      await setCache(key,parsed)
    }
    return true 
  }
}