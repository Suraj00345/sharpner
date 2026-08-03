const express = require("express");

const app = express();
const PORT = 3000;

// Dynamic route with route parameter and query parameter
app.get("/welcome/:username", (req, res) => {
    // Route parameter
    const username = req.params.username;

    // Query parameter
    const role = req.query.role;

    res.send(`Welcome ${username}, your role is ${role}`);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});