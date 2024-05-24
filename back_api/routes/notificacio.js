const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

//penjar notificacions
router.post('/enviar', checkUserAndFetchData, async (req, res) => {
    const { title, mensaje, token } = req.body;

    const message = {
        notification: {
          title: title,
          mensaje: mensaje,
        },
        token: token,
    };

    admin.messaging().send(message)
    .then((response) => {
      console.log('Successfully sent message:', response);
      res.status(201).send('Notificacio enviada');
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });

});