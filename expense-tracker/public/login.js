const loginForm = document.querySelector("form");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Validation
  if (!email || !password) {
    alert("Email and password are required");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    // Convert response to JSON
    const data = await response.json();
    // Handle API errors
    if (!response.ok) {
      alert(data.message);
      return;
    }
    // Login successful
    alert(data.message);
    console.log("Logged in user:", data.user);
    // Store logged-in user
    localStorage.setItem("user", JSON.stringify(data.user));
    // Check stored user
    console.log("Stored user:", JSON.parse(localStorage.getItem("user")));
    // Clear form
    loginForm.reset();
    // Redirect after login
    window.location.href = "index.html";
  } catch (error) {
    console.error("Login error:", error);
    alert("Something went wrong. Please try again.");
  }
});
