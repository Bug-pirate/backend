const { createConnection } = require('../config/database');
const { calculateDistance } = require('../utils/distance');

const addSchool = async (req, res) => {
  let connection;
  try {
    const { name, address, latitude, longitude } = req.body;
    
    connection = await createConnection();
    
    const insertQuery = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    const [result] = await connection.execute(insertQuery, [name, address, latitude, longitude]);
    
    res.status(201).json({
      success: true,
      message: 'School added successfully',
      data: {
        id: result.insertId,
        name,
        address,
        latitude,
        longitude
      }
    });
  } catch (error) {
    console.error('Error adding school:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const listSchools = async (req, res) => {
  let connection;
  try {
    const { latitude, longitude } = req.query;
    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    
    connection = await createConnection();
    
    const selectQuery = 'SELECT * FROM schools';
    const [schools] = await connection.execute(selectQuery);
    
    const schoolsWithDistance = schools.map(school => ({
      ...school,
      distance: calculateDistance(userLat, userLon, school.latitude, school.longitude)
    }));
    
    schoolsWithDistance.sort((a, b) => a.distance - b.distance);
    
    res.status(200).json({
      success: true,
      message: 'Schools retrieved successfully',
      data: schoolsWithDistance,
      userLocation: {
        latitude: userLat,
        longitude: userLon
      }
    });
  } catch (error) {
    console.error('Error listing schools:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

module.exports = {
  addSchool,
  listSchools
};
