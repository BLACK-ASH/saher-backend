
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

// export class systemNotification{
//   static async global(input :SendNotificationT ){
//      const globalNotificationKey = createKey('notification', 'global')
//     const { type, title, description } = input;
//     const globalNotification = await Notification.create({
//       user : undefined,
//       type ,
//       title ,
//       description , 
//       scope : 'global'
//     })

// await deleteCache(globalNotificationKey)   

//     return true 
//   }

//   static async role(input :SendNotificationT ){
//     const { type, title, description, scope } = input;
//     const scopeKey = createKey('notification','scope',scope)
//     const roleNotification = await Notification.create({
//       user : undefined,
//       type ,
//       title ,
//       description,
//       scope 
//     })
    
//     await deleteCache(scopeKey)
  
//     return true 
//   }

//   static async specific(input :SendNotificationT ){
//     const { user, type, title, description} = input;
//     const specificNotification = await Notification.create({
//       user : user,
//       type ,
//       title ,
//       description,
//       scope : 'specific'
//     })
    
//     return true 
//   }
// }


export class systemNotification {

  static async global(input: SendNotificationT) {
    const { type, title, description } = input;

    await Notification.create({
      user: undefined,
      type,
      title,
      description,
      scope: 'global'
    });

    await deleteCacheGroup('notification');

    return true;
  }

  static async role(input: SendNotificationT) {
    const { type, title, description, scope } = input;

    await Notification.create({
      user: undefined,
      type,
      title,
      description,
      scope
    });

    await deleteCacheGroup(`role:${scope}`);

    return true;
  }

  static async specific(input: SendNotificationT) {
    const { user, type, title, description } = input;
    if(!user){throw Error}
    await Notification.create({
      user,
      type,
      title,
      description,
      scope: 'specific'
    });

    for (const userId of user) {
      const key = createKey('notification', 'user', userId);
      await deleteCache(key);
    }
    return true;
  }
}