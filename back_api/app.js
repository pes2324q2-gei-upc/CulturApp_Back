const express = require('express')
const activitatsRoutes = require('./routes/activitats')
const usersRoutes = require('./routes/users')
const amicsRoutes = require('./routes/amics')
const app = express()

app.use('/activitats', activitatsRoutes)
app.use('/users', usersRoutes)
app.use('/amics', amicsRoutes)

module.exports = app