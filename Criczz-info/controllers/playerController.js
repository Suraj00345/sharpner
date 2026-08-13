const Player = require('../models/Player');
const { Op } = require('sequelize');

// Add new player
exports.addPlayer = async (req, res) => {
  try {
    const {
      name, dob, photo_url, birth_place, career,
      matches, score, fifties, centuries, wickets, average
    } = req.body;

    const newPlayer = await Player.create({
      name,
      dob,
      photo_url,
      birth_place,
      career,
      matches: matches || 0,
      score: score || 0,
      fifties: fifties || 0,
      centuries: centuries || 0,
      wickets: wickets || 0,
      average: average || 0.00
    });

    res.status(201).json({
      success: true,
      message: 'Player created successfully!',
      player: newPlayer
    });
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Search players by name
exports.searchPlayer = async (req, res) => {
  try {
    const { name } = req.query;

    let searchCondition = {};
    if (name) {
      searchCondition = {
        name: {
          [Op.like]: `%${name}%`
        }
      };
    }

    const players = await Player.findAll({
      where: searchCondition,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, players });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};