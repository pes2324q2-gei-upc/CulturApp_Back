const express = require('express')
const activitatsRoutes = require('./routes/activitats')
const usersRoutes = require('./routes/users')
const forosRoutes = require('./routes/foros')
const app = express()

app.use('/activitats', activitatsRoutes)
app.use('/users', usersRoutes)
app.use('/foros', forosRoutes)

module.exports = app