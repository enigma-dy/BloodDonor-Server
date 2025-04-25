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
} from "../controllers/auth.controller.js";
import { protect, verifyEmail } from "../middlewares/auth.js";
import {
  validateRegister,
  validateRegisterStaff,
} from "../validators/authValidator.js";
import { handleValidationErrors } from "../middlewares/validation-error.js";
import { authorize } from "../middlewares/auth.js";
import upload from "../utils/upload.js";

const router = express.Router();

router.post("/register", register);

router.post(
  "/admin/register",
  validateRegisterStaff,
  handleValidationErrors,
  authorize("admin"),
  registerStaff
);

router.post("/staff/login", loginStaff);
router.post("/login", login);
router.get("/verify/:verificationToken", verifyEmail);
router.get("/me", protect, getMe);
router.put("/update", protect, upload.single("profilePic"), updateDetails);
router.put("/updatepassword", protect, updatePassword);
router.patch("/users/assign-role", protect, authorize("admin"), assignRole);

export default router;
