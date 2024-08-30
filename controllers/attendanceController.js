const mongoose = require('mongoose');
const Attendance = require('../models/attendance');
const Location = require('../models/location');
const { getDistance } = require('geolib');

// Function to update user location
const updateLocation = async (req, res) => {
  const { userId, latitude, longitude, name } = req.body;
  const date = new Date();

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: 'Invalid User ID' });
  }

  try {
    const location = await Location.findOne({ name });
    if (!location || !location.coordinates || !location.coordinates.coordinates) {
      return res.status(404).json({ message: 'HQ location not found' });
    }

    const [hqlongitude, hqlatitude] = location.coordinates.coordinates;
    const isInsideHQ = checkIfInsideGeofence(latitude, longitude, hqlatitude, hqlongitude);

    console.log('User Location:', latitude, longitude);
    console.log('HQ Location:', hqlatitude, hqlongitude);
    console.log('Is Inside HQ:', isInsideHQ);

    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    let attendanceRecord = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!attendanceRecord) {
      attendanceRecord = new Attendance({
        userId,
        date: startOfDay,
        records: []
      });
    }

    const todayRecords = attendanceRecord.records || [];
    const lastRecord = todayRecords[todayRecords.length - 1] || {};

    console.log('Last Record:', lastRecord);

    if (isInsideHQ) {
      if (!lastRecord.checkInTime || (lastRecord.checkOutTime && lastRecord.checkInTime)) {
        todayRecords.push({
          checkInTime: new Date(),
          location: { type: 'Point', coordinates: [longitude, latitude] },
          isInsideHQ: true,
          status: 'Checked In'
        });
        console.log('Checked In:', todayRecords[todayRecords.length - 1]);
      }
    } else {
      if (lastRecord.checkInTime && !lastRecord.checkOutTime) {
        lastRecord.checkOutTime = new Date();
        lastRecord.isInsideHQ = false;
        lastRecord.status = 'Checked Out';
        lastRecord.workingHours = calculateWorkingHours(lastRecord.checkInTime, lastRecord.checkOutTime);
        todayRecords[todayRecords.length - 1] = lastRecord;
        console.log('Checked Out:', lastRecord);
      }
    }

    attendanceRecord.records = todayRecords;
    await attendanceRecord.save();

    res.status(200).json({
      message: lastRecord.status || 'Location Updated Successfully',
      checkInTime: lastRecord.checkInTime || null,
      checkOutTime: lastRecord.checkOutTime || null,
      workingHours: lastRecord.workingHours || null
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Function to get attendance details for a specific date
const getAttendanceDetails = async (req, res) => {
  const { userId, date } = req.query;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: 'Invalid User ID' });
  }

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceRecord = await Attendance.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!attendanceRecord) {
      return res.status(404).json({ message: 'No attendance record found for this date' });
    }

    // Process records to calculate working hours
    const processedRecords = attendanceRecord.records.map(record => {
      if (record.checkInTime && record.checkOutTime) {
        record.workingHours = calculateWorkingHours(record.checkInTime, record.checkOutTime);
      } else {
        record.workingHours = null;
      }
      return record;
    });

    res.status(200).json({
      records: processedRecords
    });
  } catch (error) {
    console.error('Error fetching attendance details:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Function to check if the user is inside the HQ geofence
const checkIfInsideGeofence = (latitude, longitude, hqlatitude, hqlongitude) => {
  const distanceThreshold = 200.0; // meters

  const distance = getDistance(
    { latitude, longitude },
    { latitude: hqlatitude, longitude: hqlongitude }
  );

  return distance <= distanceThreshold;
};

// Function to calculate working hours between check-in and check-out times
const calculateWorkingHours = (checkInTime, checkOutTime) => {
  const millisecondsInAnHour = 3600000;
  const duration = checkOutTime - checkInTime;
  return (duration / millisecondsInAnHour).toFixed(2); // Return hours with 2 decimal places
};

// Export the functions
module.exports = { updateLocation, getAttendanceDetails };