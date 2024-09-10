const express = require('express');
const authenticateUser = require('../../geoAttendenceBackend/middleware/authMiddleware');
const authCompanyMiddleware = require('../../geoAttendenceBackend/middleware/authCompanyMiddleware');
const router = express.Router();
const{
    applyLeave,
    approveRejectLeave,
    getUserLeaves,
    getLeavesOnADate,
    getLeaveStatus,
}=require('../controllers/leaveController.js');


//applying leave -> user side
router.post('/apply',authenticateUser, applyLeave);

//approve or reject the leaves -> company side
router.post('/approve-reject',authCompanyMiddleware,approveRejectLeave);

//getting all leaves of the user 
router.get('/user-leaves', authenticateUser, getUserLeaves);

//get all employees leaves for a particular date
router.get('/leave-on-date',authCompanyMiddleware, getLeavesOnADate);

//get leave status for each leave
router.get('/leave-status', getLeaveStatus);

module.exports=router;