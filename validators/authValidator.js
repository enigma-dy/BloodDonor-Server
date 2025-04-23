import { body } from "express-validator";

export const validateRegister = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("bloodType").notEmpty().withMessage("Blood type is required"),
  body("phone").notEmpty().withMessage("Phone is required"),
  body("location.latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Valid latitude is required"),
  body("location.longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Valid longitude is required"),
];

export const validateRegisterStaff = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("role").notEmpty().withMessage("Role email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("bloodType").notEmpty().withMessage("Blood type is required"),
  body("phone").notEmpty().withMessage("Phone is required"),
  body("location.latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Valid latitude is required"),
  body("location.longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Valid longitude is required"),
];
