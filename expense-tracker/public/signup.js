const signupForm = document.querySelector("form");

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document
    .getElementById("confirmPassword")
    .value.trim();

  //check if password matched
  if (password !== confirmPassword) {
    alert("password not matched");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert(data.message);

    // Clear form
    signupForm.reset();

    // Redirect to login page
    window.location.href = "login.html";
  } catch (error) {
    console.error("Signup error:", error);

    alert("Something went wrong. Please try again.");
  }
});
