const express = require('express');
const { sequelize } = require('./models');

const userRoutes = require('./routes/userRoutes');
const busRoutes = require('./routes/busRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
app.use(express.json());

// Register API Routes
app.use(userRoutes);
app.use(busRoutes);
app.use(bookingRoutes);

// Sync Models and Start Server
sequelize.sync()
  .then(() => {
    console.log('Database synced successfully.');
    app.listen(3000, () => console.log('Server running on http://localhost:3000'));
  })
  .catch(err => console.error('Failed to sync database:', err));