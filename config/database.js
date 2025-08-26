const mysql = require('mysql2/promise');
require('dotenv').config();

let isDatabaseAvailable = false;
let inMemorySchools = [];
let nextId = 1;

const createConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'school_management',
      connectTimeout: 5000
    });
    console.log('Database connected successfully');
    isDatabaseAvailable = true;
    return connection;
  } catch (error) {
    console.warn('Database connection failed, using in-memory storage:', error.message);
    isDatabaseAvailable = false;
    return null;
  }
};

const initDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      connectTimeout: 5000
    });

    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'school_management'}`);
    console.log('Database created or already exists');

    await connection.execute(`USE ${process.env.DB_NAME || 'school_management'}`);

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS schools (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(500) NOT NULL,
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await connection.execute(createTableQuery);
    console.log('Schools table created or already exists');
    isDatabaseAvailable = true;

    await connection.end();
  } catch (error) {
    console.warn('Database initialization failed, using in-memory storage:', error.message);
    console.log('💡 To use MySQL database:');
    console.log('   1. Install MySQL server');
    console.log('   2. Update .env file with correct credentials');
    console.log('   3. Restart the application');
    console.log('   For now, using in-memory storage for demonstration...');
    isDatabaseAvailable = false;
    
    inMemorySchools = [
      {
        id: 1,
        name: "Demo School 1",
        address: "123 Demo Street, Demo City",
        latitude: 28.4595,
        longitude: 77.0266,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: "Demo School 2", 
        address: "456 Sample Avenue, Sample Town",
        latitude: 28.4430,
        longitude: 77.0552,
        created_at: new Date().toISOString()
      }
    ];
    nextId = 3;
  }
};

const addSchoolToMemory = (schoolData) => {
  const newSchool = {
    id: nextId++,
    ...schoolData,
    created_at: new Date().toISOString()
  };
  inMemorySchools.push(newSchool);
  return newSchool;
};

const getSchoolsFromMemory = () => {
  return [...inMemorySchools];
};

module.exports = { 
  createConnection, 
  initDatabase, 
  isDatabaseAvailable: () => isDatabaseAvailable,
  addSchoolToMemory,
  getSchoolsFromMemory
};
