import Notification from "../models/Notification.js";

const sendNotification = async ({ user, message, type, relatedEntity }) => {
  try {
    const notification = await Notification.create({
      user,
      message,
      type,
      relatedEntity,
    });

    // socket.getIO().to(user.toString()).emit("notification", notification);

    return notification;
  } catch (err) {
    console.error("Error creating notification:", err);
  }
};

export default sendNotification;
