const API_URL = "http://localhost:3000/api/";

let currentPage = 1;
let editExpenseId = null;

// ======================================================
// AXIOS INTERCEPTOR (Attaches JWT Token to EVERY Request)
// ======================================================
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ======================================================
// USER HELPER FUNCTIONS
// ======================================================
function getToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in first.");
    window.location.href = "login.html";
    throw new Error("No token found");
  }
  return token;
}

function getCurrentUser() {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    alert("Please log in first.");
    window.location.href = "login.html";
    throw new Error("User not logged in");
  }
  return JSON.parse(storedUser);
}

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

const expenseList = document.getElementById("expenseList");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");

// ======================================================
// PREMIUM UI STATUS
// ======================================================
function checkPremiumStatus() {
  try {
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
  } catch (err) {
    console.warn("Could not check premium status:", err.message);
  }
}

// ======================================================
// FETCH & RENDER EXPENSES WITH EDIT/DELETE BUTTONS
// ======================================================
async function fetchExpenses(page = 1) {
  try {
    const res = await axios.get(`${API_URL}expenses?page=${page}&limit=5`);
    const data = res.data;

    currentPage = data.currentPage || page;

    renderExpenses(data.expenses || []);

    if (pageInfo) {
      pageInfo.textContent = `Page ${data.currentPage} of ${data.totalPages || 1}`;
    }
    if (prevBtn) prevBtn.disabled = !data.hasPreviousPage;
    if (nextBtn) nextBtn.disabled = !data.hasNextPage;
  } catch (error) {
    console.error("Fetch Expenses Error:", error.response?.data || error.message);
  }
}

function renderExpenses(expenses) {
  if (!expenseList) return;
  expenseList.innerHTML = "";

  if (expenses.length === 0) {
    expenseList.innerHTML = "<li>No expenses found.</li>";
    return;
  }

  expenses.forEach((expense) => {
    const li = document.createElement("li");
    li.id = `expense-${expense.id}`;
    li.textContent = `₹${expense.amount} - ${expense.category} - ${expense.description || ""} `;

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn-edit";
    editBtn.onclick = () => editExpenseDetails(expense);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn-delete";
    deleteBtn.onclick = () => deleteExpense(expense.id);

    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    expenseList.appendChild(li);
  });
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
    try {
      const aiResponse = await axios.post(`${API_URL}ai/categorize`, {
        description: description,
      });
      if (aiResponse.data?.category) {
        category = aiResponse.data.category;
        event.target.category.value = category;
      }
    } catch (aiErr) {
      console.warn("AI categorization fallback:", aiErr.message);
    }

    const expenseDetails = {
      amount: Number(amount),
      description: description,
      category: category,
    };

    if (editExpenseId) {
      await axios.put(`${API_URL}expenses/${editExpenseId}`, expenseDetails);
      editExpenseId = null;
    } else {
      await axios.post(`${API_URL}expenses`, expenseDetails);
    }

    event.target.reset();
    fetchExpenses(currentPage);
  } catch (error) {
    console.error("Error saving expense:", error.response?.data || error.message);
    alert(error.response?.data?.message || "Failed to save expense.");
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
// DELETE EXPENSE
// ======================================================
async function deleteExpense(id) {
  try {
    await axios.delete(`${API_URL}expenses/${id}`);
    fetchExpenses(currentPage);
  } catch (error) {
    console.error("Error deleting expense:", error.response?.data || error.message);
    alert("Failed to delete expense.");
  }
}

// ======================================================
// CASHFREE PAYMENT
// ======================================================
const cashfree = typeof Cashfree !== "undefined" ? Cashfree({ mode: "sandbox" }) : null;

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

      const token = getToken();
      const response = await fetch(`${API_URL}payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
          index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

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
      console.error("Leaderboard error:", error.response?.data || error.message);
      leaderboardList.innerHTML = "<p>Unable to load leaderboard.</p>";
    }
  });
}

// ======================================================
// MODAL CONTROLS & DOWNLOAD REPORT
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

if (downloadBtn) {
  downloadBtn.addEventListener("click", async () => {
    try {
      const token = getToken();

      const originalText = downloadBtn.innerText;
      downloadBtn.innerText = "Generating PDF...";
      downloadBtn.disabled = true;

      const response = await fetch(`${API_URL}reports/downloadPdf`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to download report");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "Expense_Report.pdf";
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      downloadBtn.innerText = originalText;
      downloadBtn.disabled = false;
    } catch (error) {
      console.error("Download Error:", error);
      alert(error.message);

      downloadBtn.innerText = "Download Report";
      downloadBtn.disabled = false;
    }
  });
}

// ======================================================
// INITIALIZATION & EVENT LISTENERS
// ======================================================
if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) fetchExpenses(currentPage - 1);
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    fetchExpenses(currentPage + 1);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  checkPremiumStatus();
  fetchExpenses(1);
});