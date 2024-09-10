const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Company = require('../models/company');
const User = require('../models/user');
const mongoose=require('mongoose')

const getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.company.id).select('-password');
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    console.error('Error fetching company profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCompanyInfoById = async (req, res) => {
  try {
    const { companyID } = req.params; 

    if (!mongoose.isValidObjectId(companyID)) {
      return res.status(400).json({ message: 'Invalid Company ID' });
  }
    
    const company = await Company.findById(companyID).select('-password'); 

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    console.error('Error fetching company info:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const employeeInfo = async (req,res) => {
  try {
    const { companyID } = req.params;

    if(!mongoose.isValidObjectId(companyID)) {
      return res.status(400).json({ message: 'Invalid Company ID' });
    }
      const user = await User.find({ companyID: companyID }).select('-password');

      if(!user) {
        return res.status(404).json({ message: 'No employees found' });
      }
      res.json(user);
  } catch (error) {
    console.error('Error fetching company info:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCompanyProfile, getCompanyInfoById, employeeInfo };