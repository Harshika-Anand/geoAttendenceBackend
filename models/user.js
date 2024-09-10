const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    companyID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company', 
      required: true
  },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password: {
        type: String, 
        required: true
      },
      pin:{
        type: Number,
        required:false
      },
      emailVerified:{
        type:Boolean,
        required:false,
        default:false
      },
      contactNumber:{
        type: String,
        required:true,
        unique:true
      },
      leaveBalance: {
        casual: { type: Number, default: 10 }, // Default leave balance for casual leave
        sick: { type: Number, default: 10 },   // Default leave balance for sick leave
        paid: { type: Number, default: 5 }     // Default leave balance for paid leave
      }
},{
    timestamps:true
});

module.exports=mongoose.model('User',userSchema)
