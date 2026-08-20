const User = require("../models/User");

// ======================================================
// CREATE CASHFREE ORDER
// ======================================================

const createCashfreeOrder = async (req, res) => {
  try {
    const userId = req.body.userId;

    // Find user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Don't allow an already premium member
    if (user.isPremium) {
      return res.status(400).json({
        success: false,
        message: "User is already a premium member",
      });
    }

    // Create unique order ID
    const orderId = `premium_${user.id}_${Date.now()}`;

    // Create Cashfree order
    const response = await fetch("https://sandbox.cashfree.com/pg/orders", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        "x-client-id": process.env.CASHFREE_APP_ID,

        "x-client-secret": process.env.CASHFREE_SECRET_KEY,

        "x-api-version": "2025-01-01",
      },

      body: JSON.stringify({
        order_id: orderId,

        order_amount: 99,

        order_currency: "INR",

        customer_details: {
          customer_id: String(user.id),

          customer_name: user.name,

          customer_email: user.email,

          customer_phone: "9999999999",
        },

        order_meta: {
          return_url: `http://localhost:3000/payment-success.html?order_id={order_id}`,
        },
      }),
    });

    const data = await response.json();

    // Cashfree returned an error
    if (!response.ok) {
      console.error("Cashfree error:", data);

      return res.status(response.status).json({
        success: false,

        message: "Failed to create Cashfree order",

        error: data,
      });
    }

    console.log("Cashfree order created:", data);

    // Send required information to frontend
    res.status(200).json({
      success: true,

      orderId: data.order_id,

      paymentSessionId: data.payment_session_id,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      success: false,

      message: "Internal server error",
    });
  }
};

// ======================================================
// VERIFY CASHFREE PAYMENT
// ======================================================

const verifyCashfreePayment = async (req, res) => {
  try {
    const { orderId, userId } = req.body;

    // Validate request
    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,

        message: "orderId and userId are required",
      });
    }

    // ----------------------------------------------
    // Find user
    // ----------------------------------------------

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User not found",
      });
    }

    // ----------------------------------------------
    // Get payment information from Cashfree
    // ----------------------------------------------

    const response = await fetch(
      `https://sandbox.cashfree.com/pg/orders/${orderId}/payments`,
      {
        method: "GET",

        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,

          "x-client-secret": process.env.CASHFREE_SECRET_KEY,

          "x-api-version": "2025-01-01",

          Accept: "application/json",
        },
      },
    );

    const payments = await response.json();

    console.log("Cashfree payments:", payments);

    // ----------------------------------------------
    // Cashfree API error
    // ----------------------------------------------

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,

        message: "Unable to verify payment",

        error: payments,
      });
    }

    // ----------------------------------------------
    // Check payment status
    // ----------------------------------------------

    const paymentSuccessful = payments.some(
      (payment) => payment.payment_status === "SUCCESS",
    );

    console.log("Payment successful:", paymentSuccessful);

    // ----------------------------------------------
    // Payment NOT successful
    // ----------------------------------------------

    if (!paymentSuccessful) {
      return res.status(400).json({
        success: false,

        message: "Payment was not successful",
      });
    }

    // ----------------------------------------------
    // Payment successful
    // ----------------------------------------------

    user.isPremium = true;

    await user.save();

    console.log(`User ${user.id} is now premium`);

    // ----------------------------------------------
    // Send success response
    // ----------------------------------------------

    res.status(200).json({
      success: true,

      message: "Payment successful. You are now a premium member!",

      isPremium: true,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    res.status(500).json({
      success: false,

      message: "Payment verification failed",
    });
  }
};

module.exports = {
  createCashfreeOrder,
  verifyCashfreePayment,
};
