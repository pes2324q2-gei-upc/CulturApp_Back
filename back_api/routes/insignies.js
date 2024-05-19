const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');
const { checkUserAndFetchData, checkAdmin, checkPerson, decryptToken } = require('./middleware');


async function Puntuacio(activitatID, res) {
    try {
        const actRef = db.collection('actividades').doc(activitatID);
        const actDoc = await actRef.get();
        if (!actDoc.exists) {
            res.status(404).send('Actividad no encontrada');
            return;
        }
        const actData = actDoc.data();
        actData.tags_categor_es.array.forEach(element => {
            
        });
        const actPunts = actData.puntuacio;
        res.status(200).send(actPunts);
    } catch (error) {
        res.status(500).send(error);
    }
}



module.exports = router;