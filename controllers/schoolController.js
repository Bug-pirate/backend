const { 
  createConnection, 
  isDatabaseAvailable, 
  addSchoolToMemory, 
  getSchoolsFromMemory 
} = require('../config/database');
const { calculateDistance } = require('../utils/distance');

const addSchool = async (req, res) => {
  let connection;
  try {
    const { name, address, latitude, longitude } = req.body;
    
    if (isDatabaseAvailable()) {
      connection = await createConnection();
      
      if (connection) {
        const insertQuery = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
        const [result] = await connection.execute(insertQuery, [name, address, latitude, longitude]);
        
        res.status(201).json({
          success: true,
          message: 'School added successfully to database',
          data: {
            id: result.insertId,
            name,
            address,
            latitude,
            longitude
          },
          storage: 'mysql'
        });
      } else {
        throw new Error('Database connection failed');
      }
    } else {
      const newSchool = addSchoolToMemory({ name, address, latitude, longitude });
      
      res.status(201).json({
        success: true,
        message: 'School added successfully to in-memory storage',
        data: {
          id: newSchool.id,
          name,
          address,
          latitude,
          longitude
        },
        storage: 'memory',
        note: 'Using in-memory storage. Data will be lost on server restart. Set up MySQL for persistent storage.'
      });
    }
  } catch (error) {
    console.error('Error adding school:', error);
    
    if (!isDatabaseAvailable()) {
      const newSchool = addSchoolToMemory({ name, address, latitude, longitude });
      
      res.status(201).json({
        success: true,
        message: 'School added successfully to in-memory storage (database fallback)',
        data: {
          id: newSchool.id,
          name,
          address,
          latitude,
          longitude
        },
        storage: 'memory',
        note: 'Database unavailable. Using in-memory storage as fallback.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
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
    
    let schools = [];
    let storageType = 'mysql';
    
    if (isDatabaseAvailable()) {
      connection = await createConnection();
      
      if (connection) {
        const selectQuery = 'SELECT * FROM schools';
        const [dbSchools] = await connection.execute(selectQuery);
        schools = dbSchools;
      } else {
        throw new Error('Database connection failed');
      }
    } else {
      schools = getSchoolsFromMemory();
      storageType = 'memory';
    }
    
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
      },
      storage: storageType,
      note: storageType === 'memory' ? 'Using in-memory storage. Set up MySQL for persistent storage.' : undefined
    });
  } catch (error) {
    console.error('Error listing schools:', error);
    
    if (!isDatabaseAvailable()) {
      const schools = getSchoolsFromMemory();
      const userLat = parseFloat(req.query.latitude);
      const userLon = parseFloat(req.query.longitude);
      
      const schoolsWithDistance = schools.map(school => ({
        ...school,
        distance: calculateDistance(userLat, userLon, school.latitude, school.longitude)
      }));
      
      schoolsWithDistance.sort((a, b) => a.distance - b.distance);
      
      res.status(200).json({
        success: true,
        message: 'Schools retrieved successfully from in-memory storage',
        data: schoolsWithDistance,
        userLocation: {
          latitude: userLat,
          longitude: userLon
        },
        storage: 'memory',
        note: 'Database unavailable. Using in-memory storage as fallback.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
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
