import express from "express";
import {
  getHospitals,
  getHospital,
  createHospital,
  updateHospital,
  deleteHospital,
  getHospitalsInRadius,
  getHospitalBloodBank,
} from "../controllers/hospital.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

import donationRouter from "./donation.routes.js";
import requestRouter from "./request.routes.js";

const router = express.Router();

router.use("/:hospitalId/donations", donationRouter);
router.use("/:hospitalId/requests", requestRouter);

router
  .route("/radius/:longitude/:latitude/:distance")
  .get(getHospitalsInRadius);

router
  .route("/")
  .get(getHospitals)
  .post(protect, authorize("admin", "staff"), createHospital);

router
  .route("/:id")
  .get(getHospital)
  .put(protect, authorize("admin"), updateHospital)
  .delete(protect, authorize("admin"), deleteHospital);

router.route("/:id/bloodbank").get(getHospitalBloodBank);

export default router;
