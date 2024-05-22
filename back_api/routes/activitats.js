const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

const checkPerson = require('./middleware').checkPerson;

router.get('/read/all', checkPerson, async (req, res) => {
    try {
        const activityRef = db.collection("actividades").limit(100);
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

router.get('/read/vencidas', checkPerson, async (req, res) => {
    try {
        const activityRef = db.collection("vencidas").limit(100);
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

router.post('/create/valoracion', async (req, res) => {
    try {
        const { idActividad, puntuacion, comentario } = req.body;

        const valoracionesRef = db.collection('valoraciones').doc(idActividad);

        const valoracionDoc = await valoracionesRef.get();
        let comentarios = valoracionDoc.exists && valoracionDoc.data().comentarios ? valoracionDoc.data().comentarios : [];
        let puntuacionActual = valoracionDoc.exists && valoracionDoc.data().puntuacion ? valoracionDoc.data().puntuacion : 0;
        let cantidad = valoracionDoc.exists && valoracionDoc.data().cantidad ? valoracionDoc.data().cantidad : 0;
        
        if (comentario) {
            comentarios.push(comentario);
        }

        let valoracionData = {};
        if (puntuacion !== -1) {
            let nuevaPuntuacion = ((puntuacionActual * cantidad) + puntuacion) / (cantidad + 1);
            valoracionData.puntuacion = nuevaPuntuacion;
        }
        valoracionData.comentarios = comentarios;
        valoracionData.cantidad = cantidad + 1;

        if (!valoracionDoc.exists) {
            await valoracionesRef.set(valoracionData);
        } else {
            await valoracionesRef.set(valoracionData, { merge: true });
        }

        res.status(200).send('Valoración creada o actualizada con éxito');
    }
    catch (error){
        res.status(500).send(error);
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

router.post('/toVencidas', checkPerson, async (req, res) => {
    try {
        var date = new Date().toISOString();
        date = date.replace('Z', '');
        const activityRef = db.collection("actividades").where('data_inici', '<', date);
        const response = await activityRef.get();
        response.forEach(async doc => {
            if(doc.data().data_fi < date) {
                await db.collection('vencidas').doc(doc.id).set(doc.data());
                await db.collection('actividades').doc(doc.id).delete();
            }
            else if(doc.data().data_fi > "No disponible") {
                await db.collection('vencidas').doc(doc.id).set(doc.data());
                await db.collection('actividades').doc(doc.id).delete();
            }
        });
        res.status(200).send('Actividades pasadas a vencidas');

    }
    catch(error){
        res.status(404).send
    }
});

router.get('/reward/:id', checkPerson, async (req, res) => {
    try {
        const idAct = req.params.id;
        const activityRef = db.collection("actividades").doc(idAct);
        const doc = await activityRef.get();

        if (!doc.exists) {
            return res.status(404).send('Actividad no encontrada');
        }

        const activityData = doc.data();
        const reward = activityData.reward;
        if (reward == null) {
            return res.status(200).send("null");
        } else {
            return res.status(200).send("cubata");
        }

    } catch (error) {
        return res.status(500).send(error.message);
    }
});

router.post('/reward/:id', checkPerson, async (req, res) => {
    try {
        const idAct = req.params.id;
        const activityRef = db.collection("actividades").doc(idAct);
        const doc = await activityRef.get();

        if (!doc.exists) {
            return res.status(404).send('Actividad no encontrada');
        }

        const { reward } = req.body;

        await activityRef.update({
            'reward': reward,
        });
        res.status(200).send('OK');

    } catch (error) {
        return res.status(500).send(error.message);
    }
});

module.exports = router