const express = require('express');
const authenticateUser = require('../middleware/authMiddleware.js');
const authCompanyMiddleware = require('../middleware/authCompanyMiddleware');
const router = express.Router();
const{
    applyLeave,
    approveRejectLeave,
    getUserLeaves,
    getLeavesOnADate,
    getLeaveStatus,
}=require('../controllers/leaveController.js');


//applying leave -> user side
router.post('/apply', applyLeave);

//approve or reject the leaves -> company side
router.post('/approve-reject',approveRejectLeave);

//getting all leaves of the user 
router.post('/user-leaves', getUserLeaves);

//get all employees leaves for a particular date
router.post('/leave-on-date', getLeavesOnADate);

//get leave status for each leave
router.post('/leave-status', getLeaveStatus);

module.exports=router;

