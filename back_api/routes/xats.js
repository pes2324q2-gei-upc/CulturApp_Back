const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

//crear xat
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

//post de mensajes 
router.post('/:xatId/mensajes', async (req, res) => {
    console.log("intenta crear un missatge")
    try {
        const { senderId, receiverId, mensaje, fecha } = req.body;
        const xatId = req.params.xatId;

        // Verificar si el xat existe
        const xatRef = db.collection('xats').doc(xatId);
        const xatSnapshot = await xatRef.get();

        //si no existe crear?
        if (!xatSnapshot.exists) {
            res.status(404).send("Xat no encontrado");
            return;
        }

        // Agregar el nuevo mensaje al xat
        await xatRef.collection('mensajes').add({
            senderId: senderId,
            receiverId: receiverId,
            mensaje: mensaje,
            fecha: fecha
        });

        res.status(201).send("Mensaje agregado exitosamente al xat");
    } catch (error) {
        console.error("Error al agregar mensaje al xat:", error);
        res.status(500).send("Error interno del servidor");
    }
});

//get mensajes
router.get('/:xatId/mensajes', async (req, res) => {
    try {
        const xatId = req.params.xatId;
        
        //Obtener los mensajes del xat con el xatId especificado
        const mensajesRef = db.collection('xats').doc(xatId).collection('mensajes');
        const snapshot = await mensajesRef.get();

        if (snapshot.empty) {
            console.log('No hay mensajes encontrados para el xat con el ID:', xatId);
            res.status(404).send('No hay mensajes encontrados para el xat');
            return;
        }

        let mensajes = [];
        snapshot.forEach(doc => {
            mensajes.push(doc.data());
        });

        res.status(200).json(mensajes);
    } catch (error) {
        console.error('Error al obtener los mensajes del xat:', error);
        res.status(500).send('Error interno del servidor');
    }
});

module.exports = router