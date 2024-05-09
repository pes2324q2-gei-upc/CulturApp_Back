const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

const checkUserAndFetchData = require('./middleware').checkUserAndFetchData;
const checkUsername = require('./middleware').checkUsername;

//mirar si existeix el xat
router.get('/exists', checkUserAndFetchData, async (req, res) => {
    try {
        var receiverId = req.query.receiverId;

        const username = req.userDocument.data().username;

        const docRef = db.collection('xats').where('receiverId', '==', receiverId).where('senderId', '==', username).limit(1);
        const snapshot = await docRef.get();
        
        if(!snapshot.empty) {
            const data = snapshot.docs[0].data();
            res.status(200).json({ "exists": true, "data": data });
            return; // Return to prevent further execution
        }

        const xatRef = db.collection('xats').where('receiverId', '==', username).where('senderId', '==', receiverId).limit(1);
        const xatSnapshot = await xatRef.get();

        if (!xatSnapshot.empty) {
            const data = xatSnapshot.docs[0].data();
            res.status(200).json({ "exists": true, "data": data });
        } else {
            res.status(200).json({ "exists": false });
        }
    } catch (error) {
        res.status(500).send("Error interno del servidor");
    }
});

//crear xat
router.post('/create', checkUserAndFetchData, async(req, res) => {
    try {
        const { receiverId } = req.body;

        if (!(await checkUsername(receiverId, res, 'Usuario que se intenta añadir al grupo no encontrado'))) return;

        const username = req.userDocument.data().username;
 
        const docRef = await db.collection('xats').add({
            'senderId': username,
            'receiverId': receiverId,
            'last_msg': ' ',
            'last_time': ' '
        });

        res.status(201).send({ message: "Xat creado exitosamente", id: docRef.id });
    }
    catch (error){
        res.status(500).send("Error interno del servidor");
    }
});

//post de mensajes 
router.post('/:xatId/mensajes', checkUserAndFetchData, async (req, res) => {
    try {
        const { mensaje, fecha } = req.body;
        const xatId = req.params.xatId;

        const username = req.userDocument.data().username;

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
            senderId: username,
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