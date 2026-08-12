const { Bus, Booking, User } = require('../models');

// Create Bus
exports.createBus = async (req, res) => {
  try {
    const { busNumber, totalSeats, availableSeats } = req.body;
    const bus = await Bus.create({ busNumber, totalSeats, availableSeats });
    res.status(201).json(bus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Bookings for a Specific Bus (with User Details)
exports.getBusBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await Booking.findAll({
      where: { busId: id },
      attributes: ['id', 'seatNumber'],
      include: [
        {
          model: User,
          attributes: ['name', 'email']
        }
      ]
    });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};