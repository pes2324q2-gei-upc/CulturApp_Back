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
            'members': members
        });

        res.status(201).send({ message: "Grup creado exitosamente", id: docRef.id });
    }
    catch (error){
        console.error("Error al crear el grupo:", error);
        res.status(500).send("Error interno del servidor");
    }
});

module.exports = router