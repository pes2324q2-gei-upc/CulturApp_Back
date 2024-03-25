const express = require('express')
const activitatsRoutes = require('./routes/activitats')
const userRoutes = require('./routes/user')
const app = express()

app.use('/activitats', activitatsRoutes)
app.use('/user', userRoutes)

module.exports = app