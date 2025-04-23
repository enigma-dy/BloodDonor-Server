import nodemailer from "nodemailer";
import ErrorResponse from "../utils/errorResponse.js";

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: "Blood Donation System <noreply@blooddonation.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: // Add HTML content if needed
  };

  // 3) Actually send the email
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    throw new ErrorResponse("Email could not be sent", 500);
  }
};

export default sendEmail;
