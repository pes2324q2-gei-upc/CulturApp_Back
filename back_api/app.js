const express = require('express')
const activitatsRoutes = require('./routes/activitats')
const usersRoutes = require('./routes/users')
const amicsRoutes = require('./routes/amics')
const ticketsRoutes = require('./routes/tickets')
const adminRoutes = require('./routes/admin')
const app = express()

app.use('/activitats', activitatsRoutes)
app.use('/users', usersRoutes)
app.use('/amics', amicsRoutes)
app.use('/tickets', ticketsRoutes)
app.use('/admin', adminRoutes)

module.exports = app