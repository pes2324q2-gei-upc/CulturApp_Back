const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

//crear grup
router.post('/create', async(req, res) => {
    try {
        //console.log("Solicitud recibida en la ruta '/grups/create'");

        const { name, descr, /*admin,*/ imatge, members } = req.body;
 
        const docRef = await db.collection('grups').add({
            'id': " ",
            'nom': name,
            'descripcio': descr,
            'imatge': imatge,
            //'creador': admin,
            'participants': members,
            'last_msg': ' ',
            'last_time': ' '
        });

        res.status(201).send({ message: "Grup creado exitosamente", id: docRef.id });

        // Actualitzar l'ultim missatge i data al grup
        await docRef.update({
            id: docRef.id
        });
    }
    catch (error){
        res.status(500).send("Error interno del servidor");
    }
});

//get grup info 
router.get('/:grupId', async (req, res) => {
    try {
        const grupId = req.params.grupId;

        const mensajesRef = db.collection('grups').doc(grupId);
        const doc = await mensajesRef.get();

        //verifica que el document existeix
        if (!doc.exists) {
            return res.status(404).json({ error: 'Grup not found' });
        }

        const infoGrup = doc.data();
        return res.status(200).json(infoGrup);

    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

//get dels grups on es troba l'usuari
router.get('/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const querySnapshot = await db.collection('grups').where('members', 'array-contains', userId).get();
    
        const userGroups = [];
    
        querySnapshot.forEach(doc => {
            const groupData = doc.data();
            userGroups.push(groupData);
        });
    
        return res.status(200).json(userGroups);
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

//update info del grup
router.put('/:grupId/update', async (req, res) => {
    try {
        const grupId = req.params.grupId;
        const { name, descr, imatge, members } = req.body;

        await db.collection('grups').doc(grupId).update({
            'nom': name,
            'descripcio': descr,
            'imatge': imatge,
            'participants': members
        });

        res.status(200).send({ message: "Grupo actualizado exitosamente" });

    } catch (error) {
        console.error("Error al actualitzar info del grup:", error);
        res.status(500).send("Error interno del servidor");
    }
});


//post de mensajes 
router.post('/:grupId/mensajes', async (req, res) => {
    try {
        const { senderId, mensaje, fecha } = req.body;
        const grupId = req.params.grupId;

        // Verificar si el xat existe
        const grupRef = db.collection('grups').doc(grupId);
        const grupSnapshot = await grupRef.get();

        if (!grupSnapshot.exists) {
            res.status(404).send("Grup no encontrado");
            return;
        }

        // Agregar el nuevo mensaje al grup
        await grupRef.collection('mensajes').add({
            senderId: senderId,
            mensaje: mensaje,
            fecha: fecha
        });

        // Actualitzar l'ultim missatge i data al grup
        await grupRef.update({
            last_msg: mensaje,
            last_time: fecha
        });

        res.status(201).send("Mensaje agregado exitosamente al grup");
    } catch (error) {
        //console.error("Error al agregar mensaje al grup:", error);
        res.status(500).send("Error interno del servidor");
    }
});

//get mensajes
router.get('/:grupId/mensajes', async (req, res) => {
    try {
        const grupId = req.params.grupId;
        
        //Obtener los mensajes del xat con el grupId especificado
        const mensajesRef = db.collection('grups').doc(grupId).collection('mensajes');
        const snapshot = await mensajesRef.get();

        if (snapshot.empty) {
            //console.log('No hay mensajes encontrados para el grupo con el ID:', grupId);
            res.status(404).send('No hay mensajes encontrados para el grupo');
            return;
        }

        let mensajes = [];
        snapshot.forEach(doc => {
            mensajes.push(doc.data());
        });

        res.status(200).json(mensajes);
    } catch (error) {
        //console.error('Error al obtener los mensajes del grupo:', error);
        res.status(500).send('Error interno del servidor');
    }
});

module.exports = router