const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendResetEmail = async (toEmail, resetToken) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password.html?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Password Reset Request",
    html: `
      <h3>You requested a password reset</h3>
      <p>Click the link below to set a new password. This link is valid for 1 hour.</p>
      <a href="${resetLink}">Reset My Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendResetEmail };