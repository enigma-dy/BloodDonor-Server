import express from "express";
import {
  getFeedback,
  getEntityFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback,
} from "../controllers/feedback.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router
  .route("/")
  .get(protect, authorize("admin"), getFeedback)
  .post(protect, createFeedback);

router.route("/:type/:entityId").get(protect, getEntityFeedback);

router
  .route("/:id")
  .put(protect, updateFeedback)
  .delete(protect, deleteFeedback);

export default router;
