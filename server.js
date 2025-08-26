const express = require('express');
const cors = require('cors');
const { initDatabase, isDatabaseAvailable } = require('./config/database');
const schoolRoutes = require('./routes/schoolRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'School Management API is running',
    version: '1.0.0',
    storage: isDatabaseAvailable() ? 'MySQL Database' : 'In-Memory Storage',
    endpoints: {
      addSchool: 'POST /addSchool',
      listSchools: 'GET /listSchools'
    },
    note: !isDatabaseAvailable() ? 'Using in-memory storage. Set up MySQL for persistent data.' : undefined
  });
});

app.use('/', schoolRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`School Management API server running on port ${PORT}`);
      console.log(`Server URL: http://localhost:${PORT}`);
      console.log(`Storage: ${isDatabaseAvailable() ? 'MySQL Database' : 'In-Memory Storage'}`);
      if (!isDatabaseAvailable()) {
        console.log(`Note: Using in-memory storage. Data will be lost on restart.`);
        console.log(`To use persistent storage, set up MySQL and update .env file.`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
