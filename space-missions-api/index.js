require('dotenv').config();

const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

const database = mongoose.connection;

database.on('error', (error) => {
    console.error('Database connection error:', error);
});

database.once('connected', () => {
    console.log('Database Connected');
});

mongoose.connect(process.env.DATABASE_URL);

const app = require('./app');
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server Started at ${port}`);
});
