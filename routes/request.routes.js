import express from "express";
import {
  getRequests,
  getRequest,
  createRequest,
  updateRequest,
  deleteRequest,
  fulfillRequest,
} from "../controllers/request.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(protect, getRequests)
  .post(protect, authorize("hospital", "admin"), createRequest);

router
  .route("/:id")
  .get(protect, getRequest)
  .put(protect, authorize("hospital", "admin"), updateRequest)
  .delete(protect, authorize("hospital", "admin"), deleteRequest);

router.route("/:id/fulfill").put(protect, authorize("donor"), fulfillRequest);

export default router;
