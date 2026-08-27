const express = require("express");
const app = express();

const PORT = 3000;

app.get("/test", (req, res) => {
  res.send("test Server is running");
});

app.listen(PORT, () => {
  console.log("server is listen on PORT 3000");
});
