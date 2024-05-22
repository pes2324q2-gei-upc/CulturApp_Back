const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

const checkUserAndFetchData = require('./middleware').checkUserAndFetchData;
const checkUsername = require('./middleware').checkUsername;

//mirar si existeix el xat
router.get('/exists', checkUserAndFetchData, async (req, res) => {
    try {
        //pillar id del receiver, me pasan username
        var receiver = req.query.receiver;

        const collectionReceiver =  db.collection('users').where('username', '==', receiver);
        const receiverSnapshot  = await collectionReceiver.get();

        const receiverId = receiverSnapshot.docs[0].id;

        const userId = req.userDocument.id;

        if(req.userDocument.data().blockedUsers.includes(receiverId) || receiverSnapshot.docs[0].data().blockedUsers.includes(userId)) {
            res.status(200).send("Usuario bloqueado")
            return;
        }

        const docRef = db.collection('xats').where('receiverId', '==', receiverId).where('senderId', '==', userId).limit(1);
        const snapshot = await docRef.get();
        
        if(!snapshot.empty) {
            const data = snapshot.docs[0].data();
            res.status(200).json({ "exists": true, "data": data });
            return; 
        }

        const xatRef = db.collection('xats').where('receiverId', '==', userId).where('senderId', '==', receiverId).limit(1);
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
        const { receiver } = req.body;

        if (!(await checkUsername(receiver, res, 'Usuario que se intenta añadir al grupo no encontrado'))) return;

        const collectionReceiver =  db.collection('users').where('username', '==', receiver);
        const receiverSnapshot  = await collectionReceiver.get();

        const receiverId = receiverSnapshot.docs[0].id;

        const username = req.userDocument.data().id;
        if(req.userDocument.data().blockedUsers.includes(receiverId) || receiverSnapshot.docs[0].data().blockedUsers.includes(username)) {
            res.status(200).send("Usuario bloqueado")
            return;
        }

        /*const xataux = await db.collection('xats').where('senderId', '==', receiverId).where('receiverId', '==', username).limit(1).get();
        if(!xataux.empty) {
            res.status(201).send({message: "Xat ya existe", id: xataux.docs[0].id});
            return;
        }*/

        const docRef = await db.collection('xats').add({
            'id': " ",
            'senderId': username,
            'receiverId': receiverId,
            'last_msg': ' ',
            'last_time': ' '
        });

        res.status(201).send({ message: "Xat creado exitosamente", id: docRef.id });

        await docRef.update({
            id: docRef.id
        });
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

        const username = req.userDocument.data().id;
        
        // Verificar si el xat existe
        const xatRef = db.collection('xats').doc(xatId);
        const xatSnapshot = await xatRef.get();

        //si no existe crear?
        if (!xatSnapshot.exists) {
            res.status(404).send("Xat no encontrado");
            return;
        }
        let otherUser;
        if( req.userDocument.id == xatSnapshot.data().receiverId)
            otherUser = xatSnapshot.data().senderId;
        else
            otherUser = xatSnapshot.data().receiverId;

        const otherUserDoc = await db.collection('users').doc(otherUser).get();
        if((!req.userDocument.data().blockedUsers.includes(otherUserDoc.data().id))  &&
         (!otherUserDoc.data().blockedUsers.includes(req.userDocument.data().id))) {
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
            return;
        }
        else {
            res.status(200).send("Usuario bloqueado");
            return;
        }
    } catch (error) {
        //console.error("Error al agregar mensaje al xat:", error);
        res.status(500).send("Error interno del servidor");
    }
});

//get mensajes
router.get('/:xatId/mensajes', checkUserAndFetchData, async (req, res) => {
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
        const xatDoc = await db.collection('xats').doc(xatId).get();
        const otherUser = xatDoc.data().receiverId == req.userDocument.id ? xatDoc.data().senderId : xatDoc.data().receiverId;
        const otherUserDoc = await db.collection('users').doc(otherUser).get();
        if(req.userDocument.data().blockedUsers.includes(otherUserDoc.data().id)
             || otherUserDoc.data().blockedUsers.includes(req.userDocument.id)) {
            res.status(200).send("Usuario bloqueado");
            return;
        }
        let mensajes = [];
        for (const doc of snapshot.docs) {
            let messageData = doc.data();
            const userRef = db.collection('users').doc(messageData.senderId);
            const userDoc = await userRef.get();
            messageData.senderId = userDoc.data().username;
            mensajes.push(messageData);
        }
        res.status(200).json(mensajes);
    } catch (error) {
        //console.error('Error al obtener los mensajes del xat:', error);
        res.status(500).send('Error interno del servidor');
    }
});

module.exports = router