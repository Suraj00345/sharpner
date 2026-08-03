const express = require('express');
const app = express();
const PORT = 3000;

//GET /order
app.get("/orders",(req,res)=>{
    res.send("Here is the list of all orders.")
});
//POST/orders
app.post("/orders",(req,res)=>{
    res.send("A new order has been created.")
});
//GET/users
app.get("/users",(req,res)=>{
    res.send("Here is the list of all the user.")
});
//POST/Users
app.post("/users",(req,res)=>{
    res.send("A New user has been added.");
})


app.listen(PORT,(req,res)=>{
    console.log(`Server is running on ${PORT}`);
})