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
        res.status(200).send(insigniesDoc.data());
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;