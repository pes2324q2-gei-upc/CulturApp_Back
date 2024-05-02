const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

const checkPerson = require('./middleware').checkPerson;

router.get('/read/all', checkPerson, async (req, res) => {
    try {
        const activityRef = db.collection("actividades").limit(20);
        const response = await activityRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(404).send(error);
    }
});

router.get('/categoria/:categoria', checkPerson, async (req, res) => {
    try {
        var cats = req.params.categoria.split(',');
        const activityRef = db.collection("actividades").where('tags_categor_es', 'array-contains-any', cats);
        const response = await activityRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(404).send(error);
    }
});

router.get('/date/:date', checkPerson, async (req, res) => {
    try {
        var date = req.params.date;
        date = date.slice(0, -4);
        date = date.replace(' ', 'T');
        const activityRef = db.collection("actividades").where('data_inici', '>=', date)
                            .where('data_inici', '!=', 'No disponible')//.where('data_inici', '!=', '9999-09-09T00:00:00.000');
        const response = await activityRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(404).send(error);
    }
});

router.get('/name/:name', checkPerson, async (req, res) => {
    try {
        var nomAct = req.params.name;
        const activityRef = db.collection("actividades").where('denominaci', '==', nomAct);
        const response = await activityRef.get();

        if(response.empty) return res.status(404).send('Actividad no encontrada');

        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(404).send(error);
    }
});

router.get('/read/:id', checkPerson, async (req, res) => {
    try {
        const actId = req.params.id;
        const activityRef = db.collection("actividades").doc(actId);
        const response = await activityRef.get();
        if(!response.exists) return res.status(404).send('Actividad no encontrada');
        res.status(200).send(response.data());
    } catch (error){
        res.send(407).send(error);
    }
});

router.get('/mediambient', checkPerson, async (req, res) => {

    /*global.callCount++;
    if (global.callCount > 0) {
        return res.status(429).send('Numero de crides diaries superat');
    }*/

    try {
        let date = new Date().toISOString();
        date = date.replace('Z', '');
        const activityRef = db.collection("actividades").where('tags_categor_es', 'array-contains-any', ['Residus', 'Sostenibilitat'])
                                                        .where('data_inici', '>=', date)
                                                        .orderBy('data_inici', 'asc');
        const response = await activityRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    }
    catch(error){
        res.status(404).send(error);
    }

});


module.exports = router