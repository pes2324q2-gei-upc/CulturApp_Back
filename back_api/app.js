const express = require('express')
const activitatsRoutes = require('./routes/activitats')
const usersRoutes = require('./routes/users')
const forosRoutes = require('./routes/foros')
const xatsRoutes = require('./routes/xats')
const grupsRoutes = require('./routes/grups')

const app = express()

app.use('/activitats', activitatsRoutes)
app.use('/users', usersRoutes)
app.use('/foros', forosRoutes)
app.use('/xats', xatsRoutes)
app.use('/grups', grupsRoutes)

module.exports = app