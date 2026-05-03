
import { Notification} from '../../database/notification.model.js';
import { z } from 'zod';
import { SendNotificationT } from '../../notification/notification.schema.js';


export const sendNotification = async (input: SendNotificationT) => {

  const { user, type, title, description , scope } = input;


  const notification= await Notification.create({
    user,
    type,
    title,
    description,
    scope
  });
  return notification 
};