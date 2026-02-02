const express = require('express');
const cookieParser = require('cookie-parser');


const app = express();

// Middleware to parse JSON bodies and cookies
app.use(express.json());
app.use(cookieParser());

// Mount auth routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);


module.exports = app;