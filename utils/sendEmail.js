import dotenv from "dotenv";
import nodemailer from "nodemailer";
import fetch from "node-fetch";

// Load environment variables
dotenv.config();

export async function verifyEmail(email) {
  const url = `https://api.zerobounce.net/v2/validate?api_key=${process.env.ABSTRACT_API_KEY}&email=${encodeURIComponent(email)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Check for invalid email status and mailbox_not_found sub-status
    if (data.status === "invalid" && data.sub_status === "mailbox_not_found") {
      console.log(`The email ${email} is invalid: mailbox not found.`);
      return false; // Invalid email
    }

    // If the status is valid, it will be marked as 'valid'
    if (data.status === "valid") {
      console.log(`The email ${email} is valid.`);
      return true; // Valid email
    }

    // If we encounter other invalid statuses, treat them as invalid
    console.log(`The email ${email} is invalid.`);
    return false; // Invalid email
  } catch (error) {
    console.error("Error verifying email:", error);
    return false; // Return false if there's an error
  }
}

export async function sendEmail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    service: process.env.SERVICE,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.SECURE === "true",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to,
      subject,
      text,
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email not sent");
  }
}
