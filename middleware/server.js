const express = require("express");
const app = express();
const PORT = 3000;
const router = require("./routes/index");

app.use(express.json());

app.use("/",router);

app.use((req,res)=>{
    res.status(404).send("Route not found");
})
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});