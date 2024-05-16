const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

const checkAdmin = require('./middleware').checkAdmin;

router.get('/llistarActivitats', checkAdmin, async (req, res) => {
    try {
        const activityRef = db.collection("organitzadors");
        const response = await activityRef.get();
        let responseArr = [];
        let intermediateArr = [];
        await Promise.all(response.docs.map(async doc => {
            if (!intermediateArr.includes(doc.data().activitat)) {
            intermediateArr.push(doc.data().activitat);
            let actdoc
            actdoc = await db.collection("actividades").doc(doc.data().activitat).get();
            if (!actdoc.exists) {
                actdoc = await db.collection("vencidas").doc(doc.data().activitat).get();
            }
            responseArr.push(actdoc.data());
            }
        }));
        res.status(200).send(responseArr);
    } catch (error){
        res.status(404).send(error);
    }
});

router.get('/activitat/:id/organitzadors', checkAdmin, async(req, res) => {
    try {
        const organitzadorsDocs = await db.collection('organitzadors').where('activitat', '==', req.params.id).get();
        let responseArr = [];
        await Promise.all(organitzadorsDocs.docs.map(async doc => {
            let userdoc = await db.collection("users").doc(doc.data().user).get();
            responseArr.push(userdoc.data());
        }));
        res.status(200).send(responseArr);
    }
    catch (error){
        res.status(404).send(error);
    }    
});

module.exports = router;