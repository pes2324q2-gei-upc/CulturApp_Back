const express = require('express')
const activitatsRoutes = require('./routes/activitats')
const usersRoutes = require('./routes/users')
const amicsRoutes = require('./routes/amics')
const ticketsRoutes = require('./routes/tickets')
const app = express()

app.use('/activitats', activitatsRoutes)
app.use('/users', usersRoutes)
app.use('/amics', amicsRoutes)
app.use('/tickets', ticketsRoutes)

module.exports = app