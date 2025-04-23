import express from "express";
import {
  getDonations,
  getDonation,
  createDonation,
  updateDonation,
  deleteDonation,
} from "../controllers/donation.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getDonations)
  .post(protect, authorize("donor"), createDonation);

router
  .route("/:id")
  .get(protect, getDonation)
  .put(protect, authorize("donor", "admin"), updateDonation)
  .delete(protect, authorize("donor", "admin"), deleteDonation);

export default router;
