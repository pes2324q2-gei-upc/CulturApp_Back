const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

router.post('/create', async(req, res) => {
    try {
        console.log("Solicitud recibida en la ruta '/grups/create'");

        const { name, descr, /*admin,*/ imatge, members } = req.body;
 
        const docRef = await db.collection('grups').add({
            'id': " ",
            'nom': name,
            'descripcio': descr,
            'imatge': imatge,
            //'creador': admin,
            'members': members,
            'last_msg': ' ',
            'last_time': ' '
        });

        res.status(201).send({ message: "Grup creado exitosamente", id: docRef.id });
    }
    catch (error){
        console.error("Error al crear el grupo:", error);
        res.status(500).send("Error interno del servidor");
    }
});

//post de mensajes 
router.post('/:grupId/mensajes', async (req, res) => {
    try {
        const { senderId, receiverId, mensaje, fecha } = req.body;
        const grupId = req.params.grupId;

        // Verificar si el xat existe
        const grupRef = db.collection('grups').doc(grupId);
        const grupSnapshot = await grupRef.get();

        //si no existe crear?
        if (!grupSnapshot.exists) {
            res.status(404).send("Grup no encontrado");
            return;
        }

        // Agregar el nuevo mensaje al xat
        await grupRef.collection('mensajes').add({
            senderId: senderId,
            receiverId: receiverId,
            mensaje: mensaje,
            fecha: fecha
        });

        res.status(201).send("Mensaje agregado exitosamente al grup");
    } catch (error) {
        console.error("Error al agregar mensaje al grup:", error);
        res.status(500).send("Error interno del servidor");
    }
});

module.exports = router