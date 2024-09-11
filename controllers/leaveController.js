const User = require('../models/user');
const Company = require('../models/company');
const Leave = require('../models/leave');

// Apply for leave
exports.applyLeave = async (req, res) => {
  const { leaveType, startDate, endDate, companyID, userId } = req.body;

  try {
    // Check if user exists
    const userIdToUse = req.user ? req.user.id : userId;
    console.log('userId: ', userIdToUse);
    if (!userIdToUse) {
      return res.status(400).json({ message: 'User Id is required' });
    }

    const user = await User.findById(userIdToUse);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if companyID exists
    const companyIdToUse = req.company ? req.company.id : companyID;
    if (!companyIdToUse) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    // Check leave balance for the specific leave type
    if (user.leaveBalance[leaveType] <= 0) {
      return res.status(400).json({ message: `Insufficient ${leaveType} leave balance` });
    }

    // Create a new leave request
    const leave = new Leave({
      userId: userIdToUse,
      companyID: companyIdToUse,
      leaveType,
      startDate,
      endDate,
    });

    // Save the leave request
    await leave.save();

    res.status(201).json({ message: 'Leave applied successfully', leave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error });
  }
};

// Approving or rejecting leaves -> company side
exports.approveRejectLeave = async (req, res) => {
  const { leaveId, action } = req.body;
  const validActions = ['Approved', 'Rejected'];

  if (!validActions.includes(action)) {
    return res.status(400).json({ message: 'Invalid Action' });
  }

  try {
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    leave.status = action;
    await leave.save();

    // Update leave balance of the user if approved
    if (action === 'Approved') {
      const user = await User.findById(leave.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Deduct the correct leave type balance (casual, sick, paid)
      if (user.leaveBalance[leave.leaveType.toLowerCase()] > 0) {
        user.leaveBalance[leave.leaveType.toLowerCase()] -= 1;
        await user.save();
      } else {
        return res.status(400).json({ message: `Insufficient ${leave.leaveType} leave balance` });
      }
    }

    res.status(200).json({ message: `Leave ${action.toLowerCase()} successfully` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Display user's all leaves -> accessing via the user ID
exports.getUserLeaves = async (req, res) => {
  const {userId} = req.body;
  console.log(userId);
  try {
    if (!userId) {
      return res.status(400).json({ message: 'User Id is required' });
    }

    // Finding leaves of that user
    const leaves = await Leave.find({ userId: userId });
    // Finding the user to get the leave balance
    const user = await User.findById(userId);
    console.log(leaves);
    console.log(user);

    if (leaves.length === 0) {
      return res.status(404).json({ message: 'No leaves found for this user' });
    }

    // Prepare response data
    const responseData = {
      leaves,
      leaveBalance: user.leaveBalance
    };

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getLeavesOnADate = async (req, res) => {
  const { date, companyID } = req.body;

  if (!date || !companyID) {
    return res.status(400).json({ message: 'Date and Company ID are required' });
  }

  try {
    const leaveDateStart = new Date(date);
    leaveDateStart.setHours(0, 0, 0, 0); // Set to start of the day

    const leaveDateEnd = new Date(date);
    leaveDateEnd.setHours(23, 59, 59, 999); // Set to end of the day

    // Query for leaves where the given date falls within the leave period and match the companyId
    const leaves = await Leave.find({
      companyID: companyID,               
      startDate: { $lte: leaveDateEnd },  // Leave started on or before the end of the given date
      endDate: { $gte: leaveDateStart }   // Leave ends on or after the start of the given date
    });

    // Check if no employees found on leave for the given date
    if (!leaves || leaves.length === 0) {
      return res.status(404).json({ message: 'No employees found on leave for the given date and company' });
    }

    // Manually fetch user details for each leave entry
    const employeesOnLeave = await Promise.all(leaves.map(async (leave) => {
      const user = await User.findById(leave.userId, 'name email'); // Find user by userId
      return {
        user,
        leaveDetails: leave
      };
    }));

    // Respond with the list of employees on leave
    res.status(200).json({ employeesOnLeave });
  } catch (error) {
    console.error('Error fetching leaves on date:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// Display leave status for each leave
exports.getLeaveStatus = async (req, res) => {
  const {userId} = req.body; 

  try {

    if (!userId) {
      return res.status(400).json({ message: 'User Id is required' });
    }
    
    // Fetch all leaves of the user
    const leaves = await Leave.find({ userId: userId }).select('startDate endDate status');

    // Check if the user has applied for any leaves
    if (leaves.length === 0) {
      return res.status(404).json({ message: 'No leaves found for this user' });
    }

    // Prepare response data with leave details and status
    const leaveStatus = leaves.map(leave => ({
      startDate: leave.startDate,
      endDate: leave.endDate,
      status: leave.status
    }));

    // Send response with leave status details
    res.status(200).json({ leaveStatus });
  } catch (error) {
    // Handle any errors
    res.status(500).json({ message: 'Server error', error });
  }
};
