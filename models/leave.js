const mongoose= require('mongoose');

const leavesSchema= new mongoose.Schema({
    userId: {
        type:mongoose.Schema.Types.ObjectId ,
        ref: 'user', 
        // required: true
},
companyID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'company', 
    // required: true
},
startDate: {
    type: Date,
    required: true,
},
endDate: {
    type: Date,
    required: true,
},
leaveType: {
    type: String,
    required: true,
    enum: ['Sick', 'Casual', 'Paid'],
    default: 'Casual'
},
status:{
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
}
}, {timestamps:true});

module.exports = mongoose.model ('leave', leavesSchema);

