// app.js
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
// Built-in replacement for body-parser to parse JSON request bodies
app.use(express.json());

// Routes
app.use('/api', userRoutes);

// Sync Database and Start Server
sequelize.sync()
  .then(() => {
    app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000');
    });
  })
  .catch(err => console.log('Database connection error:', err));