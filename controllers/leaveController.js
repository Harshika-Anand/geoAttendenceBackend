const User= require ('../../geoAttendenceBackend/models/user');
const Company = require ('../../geoAttendenceBackend/models/company');
const Leave= require('../models/leave');

// Apply for leave
exports.applyLeave = async (req, res) => {
  const { leaveType, startDate, endDate, companyID, userID } = req.body;

  try {
    // Check if user exists
    const userIdToUse = req.user ? req.user.id : userID;
    console.log('userID: ',userIdToUse );
    if (!userIdToUse) {
      return res.status(400).json({ message: 'User ID is required' });
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
      return res.status(400).json({ message: 'Insufficient leave balance' });
    }

    // Create a new leave
    const leave = new Leave({
      userId: userIdToUse,
      companyID: companyIdToUse,
      leaveType,
      startDate,
      endDate,
     
    });
  console.log('Request body:', req.body);
console.log('req.user:', req.user);

    // Save the leave request
    await leave.save();

    res.status(201).json({ message: 'Leave applied successfully', leave });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error });
  }
};


//Rejecting or approving leaves -> company side
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
      const user = await User.findById(leave.userID);
      console.log ('leave: ',leave.userID);
      console.log('User:', user);
      user.leaveBalance -= 1;
      await user.save();
    }

    res.status(200).json({ message: `Leave ${action.toLowerCase()} successfully` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error });
  }
};


// displaying user's all the leaves -> accessing via the user id
exports.getUserLeaves= async(req,res)=>{
    const userID=req.user.id;
    console.log(userID);
    try{
         if(!userID){
            return res.status(400).json({ message: 'User ID is required' });
         }
         
         //finding leaves of that user
         const leaves=await Leave.find({userID: userID});
         //finding the user to get the leavebalance
         const user = await User.findById(userID);
         console.log(leaves);
         console.log(user);

        if(leaves.length ===0){
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

  //displaying all the employees who took the leave on a particular date -> company's side
 
exports.getLeavesOnADate = async (req, res) => {
    const { date } = req.body; // Corrected destructuring from req.body
    
    // Validate the input date
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
  
    try {
      // Convert the date to a Date object and set the time to the start of the day
      const leaveDate = new Date(date);
    
      // Query for leaves where the startDate or endDate matches the leaveDate
      const leaves = await Leave.find({
        $or: [
          { startDate: leaveDate },
          { endDate: leaveDate }
        ]
      }).populate('userID', 'name email'); // Populate userID with name and email of the employee
    
      // Check if no employees found on leave for the given date
      if (leaves.length === 0) {
        return res.status(404).json({ message: 'No employees found on leave for the given date' });
      }
    
      // Respond with the list of employees on leave
      res.status(200).json({ employeesOnLeave: leaves });
    
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };

  // Display leave status for each leave
exports.getLeaveStatus = async (req, res) => {
    const userID = req.user.id; // Get the logged-in user's ID from request
  
    try {
      // Fetch all leaves of the user
      const leaves = await Leave.find({ userID }).select('startDate endDate status');
  
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
  
  
  