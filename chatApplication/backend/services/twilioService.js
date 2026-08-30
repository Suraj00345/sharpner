require("dotenv").config(); // Fail-safe import
const twilio = require("twilio");

// Twilio credentials from env
const accountSID = process.env.Account_SID;
const authToken = process.env.Auth_Token;
const serviceSID = process.env.Service_SID;

const client = twilio(accountSID, authToken);

// Send OTP to phone number
const sendOtpToPhoneNumber = async (phoneNumber) => {
  try {
    console.log("Sending OTP to this number:", phoneNumber);

    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    const response = await client.verify.v2
      .services(serviceSID)
      .verifications.create({ to: phoneNumber, channel: "sms" });

    return response;
  } catch (error) {
    console.error("Error sending OTP via Twilio:", error.message);
    throw error;
  }
};

// Verify OTP
const verifyOtp = async (phoneNumber, otp) => {
  try {
    console.log(`Verifying OTP ${otp} for phone number ${phoneNumber}`);

    if (!phoneNumber || !otp) {
      throw new Error("Phone number and OTP code are required.");
    }

    const response = await client.verify.v2
      .services(serviceSID)
      .verificationChecks.create({ to: phoneNumber, code: otp });

    return response; // Check response.status === "approved" in your controller
  } catch (error) {
    console.error("Error verifying OTP via Twilio:", error.message);
    throw error;
  }
};

module.exports = { sendOtpToPhoneNumber, verifyOtp };
