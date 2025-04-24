import { body } from "express-validator";

export const createDonationValidator = [
  body("bloodType", "Invalid blood type")
    .notEmpty()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "AB-", "AB+"]),

  body("quantity", "Quantity must be at least 1").notEmpty().isInt({ min: 1 }),
];
