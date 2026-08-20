const API_URL = "http://localhost:3000/api/";

let editExpenseId = null;

// ======================================================
// GET LOGGED-IN USER
// ======================================================
const storedUser = localStorage.getItem("user");

if (!storedUser) {
  alert("Please login first.");
  window.location.href = "login.html";
  throw new Error("User not logged in");
}

const user = JSON.parse(storedUser);

console.log("Logged-in user:", user);
console.log("User ID:", user.id);

// ======================================================
// PREMIUM UI
// ======================================================

const premiumBtn = document.getElementById("premiumBtn");
const premiumMessage = document.getElementById("premiumMessage");
const leaderboardBtn = document.getElementById("leaderboardBtn");
const leaderboardModal = document.getElementById("leaderboardModal");
const closeLeaderboard = document.getElementById("closeLeaderboard");
const leaderboardList = document.getElementById("leaderboardList");

// console.log(user);

if (user.isPremium === false) {
  leaderboardBtn.style.display = "none";
}

// Check whether user is already premium
function checkPremiumStatus() {
  if (user.isPremium === true) {
    if (premiumBtn) {
      premiumBtn.style.display = "none";
    }

    if (premiumMessage) {
      premiumMessage.innerHTML = `
        <div class="premium-success">
          <h4>Hi ${user.name.split(" ")[0]} Thanks!!</h4>
          <h4> for being a Premium member ❤️</h4>
        </div>
      `;
    }
  }
}

// ======================================================
// CREATE / UPDATE EXPENSE
// ======================================================

async function handleFormSubmit(event) {
  event.preventDefault();

  const expenseDetails = {
    amount: event.target.amount.value,
    description: event.target.description.value,
    category: event.target.category.value,
    userId: user.id,
  };

  console.log("Expense data:", expenseDetails);

  try {
    // ----------------------------------------------
    // UPDATE EXPENSE
    // ----------------------------------------------

    if (editExpenseId) {
      const res = await axios.put(
        `${API_URL}expenses/${editExpenseId}`,
        expenseDetails,
      );

      const oldElement = document.getElementById(`expense-${editExpenseId}`);

      if (oldElement) {
        oldElement.remove();
      }

      showExpenseOnScreen(res.data.expense);
      editExpenseId = null;
    }

    // ----------------------------------------------
    // CREATE EXPENSE
    // ----------------------------------------------
    else {
      const res = await axios.post(`${API_URL}expenses`, expenseDetails);
      showExpenseOnScreen(res.data.expense);
    }

    event.target.reset();
  } catch (error) {
    console.error(
      "Error saving expense:",
      error.response?.data || error.message,
    );
  }
}

// ======================================================
// FETCH EXPENSES
// ======================================================

window.addEventListener("DOMContentLoaded", async () => {
  // Check premium status
  checkPremiumStatus();

  try {
    const res = await axios.get(`${API_URL}expenses`);
    // Only display current user's expenses
    const userExpenses = res.data.expenses.filter(
      (expense) => Number(expense.userId) === Number(user.id),
    );

    userExpenses.forEach((expense) => {
      showExpenseOnScreen(expense);
    });
  } catch (error) {
    console.error(
      "Error fetching expenses:",
      error.response?.data || error.message,
    );
  }
});

// ======================================================
// DELETE EXPENSE
// ======================================================

async function deleteExpense(id, element) {
  try {
    await axios.delete(`${API_URL}expenses/${id}`);

    element.remove();
  } catch (error) {
    console.error(
      "Error deleting expense:",
      error.response?.data || error.message,
    );
  }
}

// ======================================================
// EDIT EXPENSE
// ======================================================

function editExpenseDetails(expense) {
  document.getElementById("amount").value = expense.amount;
  document.getElementById("description").value = expense.description;
  document.getElementById("category").value = expense.category;

  editExpenseId = expense.id;
}

// ======================================================
// DISPLAY EXPENSE
// ======================================================

function showExpenseOnScreen(expense) {
  const parentElem = document.getElementById("expenseList");
  const childElem = document.createElement("li");
  childElem.id = `expense-${expense.id}`;
  const textNode = document.createTextNode(
    `${expense.amount} - ${expense.category} - ${expense.description} `,
  );

  childElem.appendChild(textNode);

  // ----------------------------------------------
  // EDIT BUTTON
  // ----------------------------------------------

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit Expense";
  editBtn.className = "btn-edit";
  editBtn.onclick = () => editExpenseDetails(expense);

  // ----------------------------------------------
  // DELETE BUTTON
  // ----------------------------------------------

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete Expense";
  deleteBtn.className = "btn-delete";
  deleteBtn.onclick = () => deleteExpense(expense.id, childElem);
  childElem.appendChild(editBtn);
  childElem.appendChild(deleteBtn);
  parentElem.appendChild(childElem);
}

// ======================================================
// CASHFREE
// ======================================================

const cashfree = Cashfree({
  mode: "sandbox",
});

// ======================================================
// PREMIUM BUTTON
// ======================================================

if (premiumBtn) {
  premiumBtn.addEventListener("click", async () => {
    try {
      // --------------------------------------------
      // Check login
      // --------------------------------------------

      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
      }

      const currentUser = JSON.parse(storedUser);
      console.log("Current user:", currentUser);
      // --------------------------------------------
      // Already premium
      // --------------------------------------------

      if (currentUser.isPremium === true) {
        alert("You are already a Premium member.");
        return;
      }

      // --------------------------------------------
      // Disable button
      // --------------------------------------------

      premiumBtn.disabled = true;
      premiumBtn.textContent = "Creating payment...";

      // --------------------------------------------
      // CREATE CASHFREE ORDER
      // --------------------------------------------

      const response = await fetch(`${API_URL}payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          userId: currentUser.id,
        }),
      });

      const data = await response.json();
      console.log("Create order response:", data);

      // --------------------------------------------
      // Order creation failed
      // --------------------------------------------

      if (!response.ok) {
        alert(data.message || "Unable to create payment");
        premiumBtn.disabled = false;
        premiumBtn.textContent = "Premium Membership - ₹99";
        return;
      }

      // --------------------------------------------
      // Check payment session
      // --------------------------------------------

      if (!data.paymentSessionId) {
        console.error("Missing paymentSessionId:", data);
        alert("Payment session was not created.");
        premiumBtn.disabled = false;
        premiumBtn.textContent = "Premium Membership - ₹99";
        return;
      }

      console.log("Cashfree order ID:", data.orderId);
      console.log("Payment session:", data.paymentSessionId);

      // --------------------------------------------
      // Store order ID
      // --------------------------------------------

      localStorage.setItem("cashfreeOrderId", data.orderId);

      // --------------------------------------------
      // OPEN CASHFREE POPUP
      // --------------------------------------------

      premiumBtn.textContent = "Opening payment...";
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_modal",
      });

      // --------------------------------------------
      // VERIFY PAYMENT
      // --------------------------------------------

      premiumBtn.textContent = "Verifying payment...";

      const verifyResponse = await fetch(`${API_URL}payment/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          orderId: data.orderId,
          userId: currentUser.id,
        }),
      });

      const verifyData = await verifyResponse.json();
      console.log("Payment verification:", verifyData);

      // --------------------------------------------
      // PAYMENT SUCCESS
      // --------------------------------------------

      if (verifyResponse.ok && verifyData.success) {
        console.log("Payment successful!");
        // Update local user
        currentUser.isPremium = true;
        // Save updated user
        localStorage.setItem("user", JSON.stringify(currentUser));
        // Show leaderboard button immediately
        leaderboardBtn.style.display = "inline-block";
        // Hide premium button
        premiumBtn.style.display = "none";
        // Show Premium message
        if (premiumMessage) {
          premiumMessage.innerHTML = `
              <div class="premium-success">
                <h4>
                 Hi ${user.name} Thanks for being a Premium member!
                </h4>
              </div>
            `;
        }
        // Remove temporary order ID
        localStorage.removeItem("cashfreeOrderId");
      }

      // --------------------------------------------
      // PAYMENT FAILED
      // --------------------------------------------
      else {
        console.log("Payment verification failed");
        alert(verifyData.message || "Payment was not successful.");
        premiumBtn.disabled = false;
        premiumBtn.textContent = "Premium Membership - ₹99";
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong while processing payment.");
      premiumBtn.disabled = false;
      premiumBtn.textContent = "Premium Membership - ₹99";
    }
  });
}

// ======================================================
// LEADERBOARD
// ======================================================

leaderboardBtn.addEventListener("click", async () => {
  // ----------------------------------------------
  // Only premium users can access leaderboard
  // ----------------------------------------------
  if (user.isPremium !== true) {
    alert("Leaderboard is available for premium members only.");
    return;
  }

  //show modal
  leaderboardModal.style.display = "flex";
  //loading message
  leaderboardList.innerHTML = "<p>Loading leaderboard... </p>";
  try {
    const response = await axios.get(`${API_URL}/premium/leaderboard`);
    const data = response.data;
    console.log("Leaderboard:", data);
    if (!data.success) {
      leaderboardList.innerHTML = "<p>Unable to load leaderboard.</p>";
      return;
    }

    // ----------------------------------------------
    // No expenses
    // ----------------------------------------------

    if (data.leaderboard.length === 0) {
      leaderboardList.innerHTML = "<p>No expenses found yet.</p>";
      return;
    }

    // ----------------------------------------------
    // Display leaderboard
    // ----------------------------------------------

    leaderboardList.innerHTML = "";

    data.leaderboard.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "leaderboard-row";
      const rank = document.createElement("span");
      rank.className = "leaderboard-rank";

      // Medal for top 3
      if (index === 0) {
        rank.textContent = "🥇";
      } else if (index === 1) {
        rank.textContent = "🥈";
      } else if (index === 2) {
        rank.textContent = "🥉";
      } else {
        rank.textContent = `#${index + 1}`;
      }

      // User name
      const name = document.createElement("span");
      name.className = "leaderboard-name";
      name.textContent = item.User.name;

      // Total expense
      const amount = document.createElement("span");
      amount.className = "leaderboard-amount";
      amount.textContent = `₹${Number(item.totalExpense).toFixed(2)}`;
      row.appendChild(rank);
      row.appendChild(name);
      row.appendChild(amount);
      leaderboardList.appendChild(row);
    });
  } catch (error) {
    console.error("Leaderboard error:", error.response?.data || error.message);
    leaderboardList.innerHTML = "<p>Unable to load leaderboard.</p>";
  }
});

// ======================================================
// CLOSE LEADERBOARD
// ======================================================

closeLeaderboard.addEventListener("click", () => {
  leaderboardModal.style.display = "none";
});

// ======================================================
// CLOSE WHEN CLICKING OUTSIDE
// ======================================================

leaderboardModal.addEventListener("click", (event) => {
  if (event.target === leaderboardModal) {
    leaderboardModal.style.display = "none";
  }
});
