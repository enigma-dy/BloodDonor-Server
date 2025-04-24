import { body } from "express-validator";

export const validateRegister = [
  body("name").notEmpty().trim().withMessage("Name is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("bloodType")
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Valid blood type is required"),
  body("phone")
    .notEmpty()
    .isMobilePhone("any")
    .withMessage("Valid phone number is required"),

  // Location validation
  body("location.latitude")
    .if(body("location").exists())
    .isFloat({ min: -90, max: 90 })
    .withMessage("Valid latitude (-90 to 90) is required"),
  body("location.longitude")
    .if(body("location").exists())
    .isFloat({ min: -180, max: 180 })
    .withMessage("Valid longitude (-180 to 180) is required"),

  body().custom((value, { req }) => {
    if (!req.body.location?.latitude || !req.body.location?.longitude) {
      if (!req.body.address || !req.body.state || !req.body.lga) {
        throw new Error("Either coordinates or full address is required");
      }
    }
    return true;
  }),
];

export const validateRegisterStaff = [
  ...validateRegister,
  body("role")
    .isIn(["admin", "staff", "hospital_admin"])
    .withMessage("Valid role is required"),
];
