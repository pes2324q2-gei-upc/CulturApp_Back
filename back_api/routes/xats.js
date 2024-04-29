const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

//existeix el xat? 
router.get('/exists', async (req, res) => {
    try {
        var receiverId = req.query.receiverId;
        var senderId = req.query.senderId;

        const docRef = db.collection('xats').where('receiverId', '==', receiverId).where('senderId', '==', senderId).limit(1);

        docRef.get()
        .then(snapshot => {
            if (!snapshot.empty) {
                // Si existe al menos un documento con el activitat_code dado, entonces el foro existe
                const data = snapshot.docs[0].data();
                res.status(200).json({ "exists": true, "data": data });
            } else {
                // Si no existe ningún documento con el activitat_code dado, el foro no existe
                res.status(200).json({ "exists": false });
            }
        })
        .catch(error => {
            res.status(500).send("Error interno del servidor");
        });
    } catch (error) {
        res.status(500).send("Error interno del servidor");
    }
});

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
    try {
        const { senderId, mensaje, fecha } = req.body;
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
            mensaje: mensaje,
            fecha: fecha
        });

        // Actualitzar l'ultim missatge i data al xat
        await xatRef.update({
            last_msg: mensaje,
            last_time: fecha
        });
        
        res.status(201).send("Mensaje agregado exitosamente al xat");
    } catch (error) {
        //console.error("Error al agregar mensaje al xat:", error);
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
            //console.log('No hay mensajes encontrados para el xat con el ID:', xatId);
            res.status(404).send('No hay mensajes encontrados para el xat');
            return;
        }

        let mensajes = [];
        snapshot.forEach(doc => {
            mensajes.push(doc.data());
        });

        res.status(200).json(mensajes);
    } catch (error) {
        //console.error('Error al obtener los mensajes del xat:', error);
        res.status(500).send('Error interno del servidor');
    }
});

module.exports = router