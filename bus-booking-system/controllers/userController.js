const { User, Booking, Bus } = require('../models');

// Create User
exports.createUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.create({ name, email });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Bookings for a Specific User (with Bus Details)
exports.getUserBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await Booking.findAll({
      where: { userId: id },
      attributes: ['id', 'seatNumber'],
      include: [
        {
          model: Bus,
          attributes: ['busNumber']
        }
      ]
    });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};