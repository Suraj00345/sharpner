const API_URL = "http://localhost:3000/api/";

let editExpenseId = null;

// ======================================================
// USER HELPER FUNCTIONS
// ======================================================
function getCurrentUser() {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    alert("Please login first.");
    window.location.href = "login.html";
    throw new Error("User not logged in");
  }
  return JSON.parse(storedUser);
}

// Initial user fetch
let user = getCurrentUser();

// ======================================================
// DOM ELEMENTS
// ======================================================
const premiumBtn = document.getElementById("premiumBtn");
const premiumMessage = document.getElementById("premiumMessage");
const leaderboardBtn = document.getElementById("leaderboardBtn");
const leaderboardModal = document.getElementById("leaderboardModal");
const closeLeaderboard = document.getElementById("closeLeaderboard");
const leaderboardList = document.getElementById("leaderboardList");
const downloadBtn = document.getElementById("downloadBtn");

// ======================================================
// PREMIUM UI
// ======================================================
function checkPremiumStatus() {
  const currentUser = getCurrentUser();

  if (currentUser.isPremium) {
    if (premiumBtn) premiumBtn.style.display = "none";
    if (leaderboardBtn) leaderboardBtn.style.display = "inline-block";
    if (downloadBtn) downloadBtn.style.display = "inline-block";

    if (premiumMessage) {
      premiumMessage.innerHTML = `
        <div class="premium-success">
          <h4>Hi ${currentUser.name?.split(" ")[0] || "User"}, thanks for being a Premium member ❤️</h4>
        </div>
      `;
    }
  } else {
    if (leaderboardBtn) leaderboardBtn.style.display = "none";
    if (downloadBtn) downloadBtn.style.display = "none";
    if (premiumBtn) premiumBtn.style.display = "inline-block";
  }
}

// ======================================================
// CREATE / UPDATE EXPENSE
// ======================================================
async function handleFormSubmit(event) {
  event.preventDefault();

  const amount = event.target.amount.value;
  const description = event.target.description.value;
  let category = event.target.category.value;

  try {
    // Determine category with Gemini if description is provided
    try {
      const aiResponse = await axios.post(`${API_URL}ai/categorize`, {
        description: description,
      });
      if (aiResponse.data?.category) {
        category = aiResponse.data.category;
        event.target.category.value = category;
      }
    } catch (aiErr) {
      console.warn(
        "AI categorization failed, using selected/default category:",
        aiErr.message,
      );
    }

    const expenseDetails = {
      amount: Number(amount),
      description: description,
      category: category,
      userId: getCurrentUser().id,
    };

    // UPDATE EXPENSE
    if (editExpenseId) {
      const res = await axios.put(
        `${API_URL}expenses/${editExpenseId}`,
        expenseDetails,
      );

      const oldElement = document.getElementById(`expense-${editExpenseId}`);
      if (oldElement) oldElement.remove();

      showExpenseOnScreen(res.data.expense);
      editExpenseId = null;
    }
    // CREATE EXPENSE
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
    alert(error.response?.data?.message || "Failed to save expense.");
  }
}

// ======================================================
// FETCH EXPENSES
// ======================================================
window.addEventListener("DOMContentLoaded", async () => {
  checkPremiumStatus();

  try {
    const currentUser = getCurrentUser();
    const res = await axios.get(`${API_URL}expenses`);
    const expenses = res.data.expenses || [];

    // Filter by current user
    const userExpenses = expenses.filter(
      (expense) => Number(expense.userId) === Number(currentUser.id),
    );

    userExpenses.forEach((expense) => showExpenseOnScreen(expense));
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
  if (!parentElem) return;

  const childElem = document.createElement("li");
  childElem.id = `expense-${expense.id}`;
  childElem.textContent = `${expense.amount} - ${expense.category} - ${expense.description} `;

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit Expense";
  editBtn.className = "btn-edit";
  editBtn.onclick = () => editExpenseDetails(expense);

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete Expense";
  deleteBtn.className = "btn-delete";
  deleteBtn.onclick = () => deleteExpense(expense.id, childElem);

  childElem.appendChild(editBtn);
  childElem.appendChild(deleteBtn);
  parentElem.appendChild(childElem);
}

// ======================================================
// CASHFREE PAYMENT
// ======================================================
const cashfree =
  typeof Cashfree !== "undefined" ? Cashfree({ mode: "sandbox" }) : null;

if (premiumBtn) {
  premiumBtn.addEventListener("click", async () => {
    try {
      const currentUser = getCurrentUser();

      if (currentUser.isPremium) {
        alert("You are already a Premium member.");
        return;
      }

      premiumBtn.disabled = true;
      premiumBtn.textContent = "Creating payment...";

      const response = await fetch(`${API_URL}payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.paymentSessionId) {
        alert(data.message || "Payment session was not created.");
        premiumBtn.disabled = false;
        premiumBtn.textContent = "Premium Membership - ₹99";
        return;
      }

      premiumBtn.textContent = "Opening payment...";
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_modal",
      });

      premiumBtn.textContent = "Verifying payment...";

      const verifyResponse = await fetch(`${API_URL}payment/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data.orderId,
          userId: currentUser.id,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok && verifyData.success) {
        currentUser.isPremium = true;
        localStorage.setItem("user", JSON.stringify(currentUser));
        checkPremiumStatus();
      } else {
        alert(verifyData.message || "Payment was not successful.");
        premiumBtn.disabled = false;
        premiumBtn.textContent = "Premium Membership - ₹99";
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong while processing payment.");
      if (premiumBtn) {
        premiumBtn.disabled = false;
        premiumBtn.textContent = "Premium Membership - ₹99";
      }
    }
  });
}

// ======================================================
// LEADERBOARD
// ======================================================
if (leaderboardBtn) {
  leaderboardBtn.addEventListener("click", async () => {
    const currentUser = getCurrentUser();

    if (!currentUser.isPremium) {
      alert("Leaderboard is available for premium members only.");
      return;
    }

    leaderboardModal.style.display = "flex";
    leaderboardList.innerHTML = "<p>Loading leaderboard... </p>";

    try {
      const response = await axios.get(`${API_URL}premium/leaderboard`);
      const data = response.data;

      if (!data.success || !data.leaderboard || data.leaderboard.length === 0) {
        leaderboardList.innerHTML = "<p>No expenses found yet.</p>";
        return;
      }

      leaderboardList.innerHTML = "";

      data.leaderboard.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "leaderboard-row";

        const rank = document.createElement("span");
        rank.className = "leaderboard-rank";
        rank.textContent =
          index === 0
            ? "🥇"
            : index === 1
              ? "🥈"
              : index === 2
                ? "🥉"
                : `#${index + 1}`;

        const name = document.createElement("span");
        name.className = "leaderboard-name";
        name.textContent = item.User?.name || "Anonymous";

        const amount = document.createElement("span");
        amount.className = "leaderboard-amount";
        amount.textContent = `₹${Number(item.totalExpense || 0).toFixed(2)}`;

        row.appendChild(rank);
        row.appendChild(name);
        row.appendChild(amount);
        leaderboardList.appendChild(row);
      });
    } catch (error) {
      console.error(
        "Leaderboard error:",
        error.response?.data || error.message,
      );
      leaderboardList.innerHTML = "<p>Unable to load leaderboard.</p>";
    }
  });
}

// ======================================================
// MODAL CONTROLS
// ======================================================
if (closeLeaderboard) {
  closeLeaderboard.addEventListener("click", () => {
    leaderboardModal.style.display = "none";
  });
}

if (leaderboardModal) {
  leaderboardModal.addEventListener("click", (event) => {
    if (event.target === leaderboardModal) {
      leaderboardModal.style.display = "none";
    }
  });
}

// ======================================================
// DOWNLOAD BUTTON
// ======================================================

downloadBtn.addEventListener("click", async () => {
  try {
    // 1. Get the JWT token you saved during login
    // (Assuming you stored it in localStorage as 'token')
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in to download reports.");
      return;
    }

    // Optional: Change button text to show it's loading
    const downloadBtn = document.getElementById("downloadBtn");
    const originalText = downloadBtn.innerText;
    downloadBtn.innerText = "Generating PDF...";
    downloadBtn.disabled = true;

    // 2. Make the request to your backend route
    // UPDATE THIS URL to match your actual backend route!
    const response = await fetch(
      "http://localhost:3000/api/reports/downloadPdf",
      {
        method: "GET",
        headers: {
         "Authorization": `Bearer ${token}` // Send the token for your userAuth middleware
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to download report");
    }

    // 3. Convert the response into a Blob (a file-like object of immutable, raw data)
    const blob = await response.blob();

    // 4. Create a temporary URL for the Blob
    const downloadUrl = window.URL.createObjectURL(blob);

    // 5. Create an invisible anchor (<a>) tag, click it to trigger download, then remove it
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "Expense_Report.pdf"; // The default file name
    document.body.appendChild(a);
    a.click();

    // 6. Clean up
    a.remove();
    window.URL.revokeObjectURL(downloadUrl); // Free up browser memory

    // Reset button
    downloadBtn.innerText = originalText;
    downloadBtn.disabled = false;
  } catch (error) {
    console.error("Download Error:", error);
    alert(error.message);

    // Reset button on error
    const downloadBtn = document.getElementById("downloadBtn");
    downloadBtn.innerText = "Download Report";
    downloadBtn.disabled = false;
  }
});
