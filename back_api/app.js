const express = require('express')
const activitatsRoutes = require('./routes/activitats')
const usersRoutes = require('./routes/users')
const cors = require('cors');
const amicsRoutes = require('./routes/amics')
const ticketsRoutes = require('./routes/tickets')
const adminRoutes = require('./routes/admin')
const forosRoutes = require('./routes/foros')
const xatsRoutes = require('./routes/xats')
const grupsRoutes = require('./routes/grups')

global.callCount = 0;

const app = express()
app.use(cors({
    origin: ['https://culturapp-webfront.onrender.com', 'Localhost:3000'], // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],         // Allow only specified methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow only specified headers
}));

app.use('/activitats', activitatsRoutes)
app.use('/users', usersRoutes)
app.use('/amics', amicsRoutes)
app.use('/tickets', ticketsRoutes)
app.use('/admin', adminRoutes)
app.use('/foros', forosRoutes)
app.use('/xats', xatsRoutes)
app.use('/grups', grupsRoutes)


module.exports = app