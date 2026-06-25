require('dotenv').config();
const path = require('path');
const express = require('express');
const citizenRoutes = require('./routes/citizen');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

app.use('/api', citizenRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
