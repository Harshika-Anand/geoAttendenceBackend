const Location = require('../models/location');
const User = require('../models/user');
const mongoose=require('mongoose');

const upsertLocation = async (req, res) => {
  const { companyID, latitude, longitude } = req.body;

  if (!mongoose.isValidObjectId(companyID)) {
    return res.status(400).json({ message: 'Invalid Company ID' });
}

  try {
    const location = await Location.findOneAndUpdate(
      { companyID },
      {
        coordinates: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Location updated successfully', location });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getLocation = async (req, res) => {
  const { companyID } = req.params;

  if (!mongoose.isValidObjectId(companyID)) {
    return res.status(400).json({ message: 'Invalid Company ID' });
}
  try {
    const location = await Location.findOne({ companyID });
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.status(200).json(location);
  } catch (error) {
    console.error('Error retrieving location:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { upsertLocation, getLocation };