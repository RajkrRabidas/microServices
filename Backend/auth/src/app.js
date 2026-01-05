const express = require('express');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Mount auth routes
const authRouter = require('./routes/auth');
app.use('/auth', authRouter);


module.exports = app;