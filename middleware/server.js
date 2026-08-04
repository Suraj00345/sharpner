const express = require("express");
// const router = require("./routes/index");
// const bookRouter = require("./routes/books");
// const courses = require('./routes/courses')
// const student = require('./routes/student')
const userRoutes = require('./routes/userRoutes');
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");

const app = express();
const PORT = 3000;

app.use(express.json());

// app.use("/",router);
// app.use("/",bookRouter);

// app.use("/students",student)
// app.use("/courses",courses)

app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);


app.use((req,res)=>{
    res.status(404).send("Route not found");
})
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});