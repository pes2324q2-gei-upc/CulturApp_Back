const express = require('express')
const router = express.Router()

const { db } = require('../firebaseConfig');

router.get('/read/all', async (req, res) => {
    try {

        const activityRef = db.collection("actividades").limit(20);
        const response = await activityRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

router.get('/categoria/:categoria', async (req, res) => {
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
        res.send(error);
    }
});

router.get('/date/:date', async (req, res) => {
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
        res.send(error);
    }
});

router.get('/name/:name', async (req, res) => {
    try {
        var nomAct = req.params.name;
        const activityRef = db.collection("actividades").where('denominaci', '==', nomAct);
        const response = await activityRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

router.get('/read/:id', async (req, res) => {
    try {
        const activityRef = db.collection("actividades").doc(req.params.id);
        const response = await activityRef.get();
        res.send(response.data());
    } catch (error){
        res.send(error);
    }
});

module.exports = router