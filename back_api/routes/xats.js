const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

router.post('/create', async(req, res) => {
    try {
        console.log("Solicitud recibida en la ruta '/xats/create'");

        const { senderId, receiverId } = req.body;
 
        const docRef = await db.collection('xats').add({
            'senderId': senderId,
            'receiverId': receiverId,
            'last_msg': ' ',
            'last_time': ' '
        });

        res.status(201).send({ message: "Xat creado exitosamente", id: docRef.id });
    }
    catch (error){
        console.error("Error al crear el xat:", error);
        res.status(500).send("Error interno del servidor");
    }
});

module.exports = router