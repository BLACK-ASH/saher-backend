
import mongoose from 'mongoose';
import { Notification } from '../../database/notification.model.js';
import { SendNotificationT } from '../../notification/notification.schema.js';
import { deleteCacheGroup } from '../redis/redis-utils.js';
import { ApiError } from '../class/api-error.js';


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
    const { user, type, title, description, scope } = input;

    const globalNotification = await Notification.create({
      user : undefined,
      type ,
      title ,
      description , 
      scope : 'global'
    })

    await deleteCacheGroup('notification')
    return globalNotification
  }

  static async role(input :SendNotificationT ){
    const { type, title, description, scope } = input;
    const roleNotification = await Notification.create({
      user : undefined,
      type ,
      title ,
      description,
      scope 
    })
    await deleteCacheGroup('notification', 'scope' , scope)
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
    if(!user){throw new ApiError(400,"user is required ")}
    for (const id of user) {
      await deleteCacheGroup('notification', 'user', id)
}
  }
}