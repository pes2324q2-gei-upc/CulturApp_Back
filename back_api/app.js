const express = require('express')
const activitatsRoutes = require('./routes/activitats')
const usersRoutes = require('./routes/users')
const app = express()

app.use('/activitats', activitatsRoutes)
app.use('/users', usersRoutes)

module.exports = app