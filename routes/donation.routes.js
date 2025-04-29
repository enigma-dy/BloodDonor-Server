import express from "express";
import {
  getDonations,
  createDonation,
  updateDonation,
  getDonationById,
  deleteDonation,
} from "../controllers/donation.controller.js";
import { protect, authorize } from "../middlewares/auth.js";
import { createDonationValidator } from "../validators/reqValidator.js";
import { handleValidationErrors } from "../middlewares/validation-error.js";

const router = express.Router({ mergeParams: true });

router.route("/").get(getDonations);

router.route("/:hospitalId").post(protect, authorize("donor"), createDonation);

router
  .route("/:id")
  .get(getDonationById)
  .put(protect, authorize("donor", "admin"), updateDonation)
  .delete(protect, authorize("donor", "admin"), deleteDonation);

export default router;
