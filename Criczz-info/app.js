const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const playerRoutes = require('./routes/playerRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', playerRoutes);

// Sync Database and Start Server
sequelize.sync()
  .then(() => {
    console.log('Database synced successfully.');
    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000');
    });
  })
  .catch(err => console.error('Failed to sync database:', err));