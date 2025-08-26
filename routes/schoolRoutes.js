const express = require('express');
const router = express.Router();
const { addSchool, listSchools } = require('../controllers/schoolController');
const { 
  validateAddSchool, 
  validateListSchools, 
  handleValidationErrors 
} = require('../middleware/validation');

router.post('/addSchool', validateAddSchool, handleValidationErrors, addSchool);
router.get('/listSchools', validateListSchools, handleValidationErrors, listSchools);d

module.exports = router;
