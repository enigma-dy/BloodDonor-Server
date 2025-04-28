import express from "express";
import {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  registerStaff,
  assignRole,
  loginStaff,
  getStaff,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protect, verifyEmail } from "../middlewares/auth.js";

import { handleValidationErrors } from "../middlewares/validation-error.js";
import { authorize } from "../middlewares/auth.js";
import upload from "../utils/upload.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);

router.get("/admin/staff", protect, authorize("admin", "staff"), getStaff);
router.post("/admin/register", protect, authorize("admin"), registerStaff);
router.post("/staff/login", loginStaff);

router.get("/verify/:verificationToken", verifyEmail);
router.get("/me", protect, getMe);
router.put("/update", protect, upload.single("profilePic"), updateDetails);
router.put("/updatepassword", protect, updatePassword);
router.patch("/users/assign-role", protect, authorize("admin"), assignRole);

export default router;
