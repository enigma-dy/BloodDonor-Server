import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.route("/").get(protect, getNotifications);

router.route("/:id/read").put(protect, markAsRead);

router.route("/read-all").put(protect, markAllAsRead);

router.route("/:id").delete(protect, deleteNotification);

export default router;
