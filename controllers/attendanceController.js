const mongoose = require('mongoose');
const Attendance = require('../models/attendance');
const Location = require('../models/location');
const { getDistance } = require('geolib');
const { addMinutes } = require('date-fns');
const { startOfDay, endOfDay, parseISO } = require('date-fns');


const convertToIST = (utcDate) => {
  return addMinutes(new Date(utcDate), 330); 
};

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

      const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();

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
      const lastRecordIndex = todayRecords.length - 1;
      const lastRecord = todayRecords[lastRecordIndex] || {};

      if (isInsideHQ) {
          if (!lastRecord.checkInTime || (lastRecord.checkOutTime && lastRecord.checkInTime)) {
              const checkInTimeUTC = new Date();
              const checkInTimeIST = convertToIST(checkInTimeUTC);

              todayRecords.push({
                  checkInTime: checkInTimeUTC,
                  location: { type: 'Point', coordinates: [longitude, latitude] },
                  isInsideHQ: true,
                  status: 'Checked In',
                  marked: 'Present'
              });

              console.log('Checked In at:', checkInTimeIST);
          }
      } else {
          if (lastRecord.checkInTime && !lastRecord.checkOutTime) {
              const checkOutTimeUTC = new Date();
              const checkOutTimeIST = convertToIST(checkOutTimeUTC);

              lastRecord.checkOutTime = checkOutTimeUTC;
              lastRecord.isInsideHQ = false;
              lastRecord.status = 'Checked Out';
              lastRecord.workingHours = calculateWorkingHours(lastRecord.checkInTime, lastRecord.checkOutTime);
              todayRecords[lastRecordIndex] = lastRecord;

              console.log('Checked Out at:', checkOutTimeIST);
          }
      }

      attendanceRecord.records = todayRecords;
      await attendanceRecord.save();

      const lastCheckInTimeIST = convertToIST(lastRecord.checkInTime);
      const lastCheckOutTimeIST = convertToIST(lastRecord.checkOutTime);

      res.status(200).json({
          message: lastRecord.status || 'Checked Out',
          checkInTime: lastCheckInTimeIST,
          checkOutTime: lastRecord.checkOutTime ? lastCheckOutTimeIST : null,
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

  // Validate userId
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: 'Invalid User ID' });
  }

  // Validate date
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ message: 'Invalid Date' });
  }

  try {
    // Parse and set the date range using date-fns
    const parsedDate = parseISO(date);
    const startOfDayDate = startOfDay(parsedDate);
    const endOfDayDate = endOfDay(parsedDate);

    console.log('Fetching records for user:', userId);
    console.log('Date Range:', startOfDayDate, 'to', endOfDayDate);

    // Query for attendance records
    const attendanceRecord = await Attendance.findOne({
      userId,
      date: { $gte: startOfDayDate, $lte: endOfDayDate }
    });

    // Check if the user has checked in at all during the day
    let markedStatus = 'Absent';
    const transformedRecords = attendanceRecord ? attendanceRecord.records.map(record => {
      if (record.checkInTime) {
        markedStatus = 'Present';
      }
      return {
        checkInTime: record.checkInTime ? convertToIST(record.checkInTime).toISOString() : null,
        checkOutTime: record.checkOutTime ? convertToIST(record.checkOutTime).toISOString() : null,
        workingHours: record.workingHours || 0,
        status: record.status,
        location: record.location,
      };
    }) : [];

    // If no records are found, return marked as 'Absent'
    if (!transformedRecords.length) {
      res.status(200).json({
        marked: 'Absent',
        records: transformedRecords
      });
    } else {
      res.status(200).json({
        marked: markedStatus,
        records: transformedRecords
      });
    }
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