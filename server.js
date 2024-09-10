const express=require('express');
const cors=require('cors');
const bodyParser=require('body-parser');
require('dotenv').config();
const connectDB=require('./config/db');
const authRoutes = require('./routes/auth');
const authCompanyRoutes = require('./routes/authCompany');
const attendanceRoutes = require('./routes/attendance');
const userRoutes = require('./routes/user');
const companyRoutes=require('./routes/company')
const locationRoutes = require('./routes/location')
const manualAttendanceRoutes = require('./routes/manualAttendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
require('./schedulers/attendanceScheduler');

const app=express();
connectDB();

app.use(cors());
app.use(bodyParser.json())

app.use('/api/auth', authRoutes);
app.use('/api/authCompany', authCompanyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/user', userRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/manual-attendance', manualAttendanceRoutes);
app.use('/api/leaves', leaveRoutes);

app.get('/',(req,res)=>{
    res.send("Welcome to geolocation attendance app!")
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));