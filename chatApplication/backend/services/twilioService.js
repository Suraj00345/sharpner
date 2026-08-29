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

    console.log("this is my otp response", response);
    return response;
  } catch (error) {
    console.error("Error sending OTP via Twilio:", error.message);
    throw error;
  }
};

//verify otp
const verifyOtp = async (phoneNumber, otp) => {
  try {
    console.log(`this is my otp ${otp} to the phoneNumber ${phoneNumber}`);

    const response = await client.verify.v2
      .services(serviceSID)
      .verificationChecks.create({ to: phoneNumber, code: otp });

    console.log("this is my otp response", response);
    return response;
  } catch (error) {
    console.error(error);
    throw new Error("otp verification");
  }
};

module.exports = { sendOtpToPhoneNumber, verifyOtp };
