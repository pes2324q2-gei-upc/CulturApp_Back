const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');
const { checkUserAndFetchData, checkAdmin, checkPerson, decryptToken } = require('./middleware');

router.get('/user/:username', checkUserAndFetchData, async (req, res) => {
    try {
        const username = req.params.username;
        const user = req.userDocument;
        let userid;
        if(username == user.data().username) {
            userid = user.id;
        }
        else {
            const userRef = db.collection('users').where('username', '==', username);
            const userDoc = await userRef.get();
            if (!userDoc.exists) {
                res.status(404).send('Usuario no encontrado');
                return;
            }
            userid = userDoc.docs[0].id;
        }
        const insigniesRef = db.collection('insignies').doc(userid);
        const insigniesDoc = await insigniesRef.get();
        if (!insigniesDoc.exists) {
            res.status(404).send('Insignies not found');
            return;
        }
        const insigniesData = insigniesDoc.data();
        const keys = Object.keys(insigniesData);

        keys.sort((a, b) => {
            const aValue = insigniesData[a];
            const bValue = insigniesData[b]
            // Ordenar por la primera componente
            const order = ['o', 'p', 'b', 'None'];
            const aIndex = order.indexOf(aValue[0]);
            const bIndex = order.indexOf(bValue[0]);
        
            if (aIndex !== bIndex) return aIndex - bIndex;

            // Si la primera componente es igual, ordenar por la segunda componente
            if (aValue[1] > bValue[1]) return -1;
            if (aValue[1] < bValue[1]) return 1;

            // Si la segunda componente también es igual, ordenar alfabéticamente
            return a.localeCompare(b);
        });

        // Crear un nuevo objeto con las claves ordenadas
        const sortedInsigniesData = {};
        keys.forEach(key => {
            sortedInsigniesData[key] = insigniesData[key];
        });

        res.status(200).send(sortedInsigniesData);
    } catch (error) {
        res.status(500).send(error);
    }
});



module.exports = router;