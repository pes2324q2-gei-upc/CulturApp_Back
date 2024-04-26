const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

const checkUserAndFetchData = require('./middleware').checkUserAndFetchData;
const checkUsername = require('./middleware').checkUsername;
const checkAdmin = require('./middleware').checkAdmin;


router.post('/create/reportUsuari', checkUserAndFetchData, async(req, res) => {
    try {
        const { titol, usuariReportat, report } = req.body;


        if (!report || !usuariReportat || !titol) {
            res.status(400).send('Faltan atributos');
            return;
        }
        //checkUsername(usuariReportat, res, 'Usuario reportado no encontrado');
        const userSnapshot = await db.collection('usuaris').where('username', '==', usuariReportat).get();

        if (userSnapshot.empty) {
            res.status(404).send('Usuario reportado no encontrado');
            return;
        }

        const reportedUserId = userSnapshot.docs[0].id;

        const reportsCollection = db.collection('reportsUsuaris');

        await reportsCollection.add({
            'user': req.userDocument.id,
            'report': report,
            'usuariReportat': reportedUserId,
            'solucionat': false,
            'administrador': '',
            'data_report': new Date(),
            'titol': titol
        })
        res.status(200).send('OK')
    } catch (error){
        res.status(404).send(error);
    }
});

router.get('/reportsUsuari/all', checkAdmin, async (req, res) => {
    try {
        const reportsRef = db.collection('reportsUsuaris');
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.id, doc.data().titol, doc.data().report);
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

router.get('/reportsUsuaris/pendents', checkAdmin, async(req, res) => {
    try {
        const reportsRef = db.collection('reportsUsuaris').where('solucionat', '==', false);
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.id, doc.data().titol, doc.data().report);
        });
        res.status(200).send(responseArr);
    } 
    catch (error){
        res.send(error);
    }
});

router.get('/reportsUsuaris/done', checkAdmin, async(req, res) => {
    try {
        const reportsRef = db.collection('reportsUsuaris').where('solucionat', '==', true)
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.id, doc.data().titol, doc.data().report);
        });
        res.status(200).send(responseArr);
    }
    catch (error){
        res.send(error);
    }
});


router.get('/reportsUsuari/:id', checkAdmin, async(req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            res.status(400).send('Falta el id del report');
            return;
        }
        const reportRef = db.collection('reportsUsuaris').doc(id);
        const doc = await reportRef.get();
        if (!doc.exists) {
            res.status(404).send('Report no encontrado');
            return;
        }
        res.status(200).send(doc.id, doc.data());
    } catch (error){
        res.send(error);
    }
});

router.put('/reportUsuari/:id/validar', checkAdmin, async(req, res) => {
    try {
        if(!req.params.id) {
            res.status(400).send('Falta el id del report');
            return;
        }
        const idAdmin = req.userDocument.id;
        const reportRef = db.collection('reportsUsuaris').doc(id);
        if(!reportRef.exists) {
            res.status(404).send('Report no encontrado');
            return;
        }
        await reportRef.update({
            'solucionat': true,
            'administrador': idAdmin
        });
        res.status(200).send('report usauri solucionat');
    } catch (error){
        res.send(error);
    }
});

router.delete('/delete/reportUsuari', checkAdmin, async(req, res) => {
    try {
        const { id } = req.body;
        if(!id) {
            res.status(400).send('Falta el id del reporte');
            return;
        }
        const reportRef = db.collection('reportsUsuaris').doc(id);
        if(!reportRef.exists) {
            res.status(404).send('Report no encontrado');
            return;
        }
        await reportRef.delete();
        res.status(200).send('report usuari eliminat');
    } catch (error){
        res.send(error);
    }
});

//Operacions de reports de bugs
router.post('/create/reportBug', checkUserAndFetchData,  async(req, res) => {
    try {
        const {titol, report } = req.body;
        if(!titol || !report) {
            res.status(400).send('Faltan atributos');
            return;
        }
        uid = req.userDocument.id;
        const reportsCollection = db.collection('reportsBugs');

        await reportsCollection.add({
            'user': uid,
            'report': report,
            'solucionat': false,
            'administrador': '',
            'data_report': new Date()
        })
        res.status(200).send('Report de bug creat')
    }
    catch (error){
        res.send(error);
    }
});

router.get('/reportsBug/all', checkAdmin, async (req, res) => {
    try {
        const reportsRef = db.collection('reportsBugs');
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.id, doc.data().titol, doc.data().report);
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

router.get('/reportsBugs/pendents', checkAdmin, async(req, res) => {
    try {
        const reportsRef = db.collection('reportsBugs').where('solucionat', '==', false);
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.id, doc.data().titol, doc.data().report);
        });
        res.status(200).send(responseArr);
    } 
    catch (error){
        res.send(error);
    }
});

router.get('/reportsBugs/solucionats', checkAdmin, async(req, res) => {
    try {
        const reportsRef = db.collection('reportsBugs').where('solucionat', '==', true);
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.id, doc.data().titol, doc.data().report);
        });
        res.status(200).send(responseArr);
    } 
    catch (error){
        res.send(error);
    }
});

router.get('/reportsBug/:id', checkAdmin, async(req, res) => {
    try {
        const id = req.params.id;
        if(!id) {
            res.status(400).send('Falta el id del report');
            return;
        }
        const reportRef = db.collection('reportsBugs').doc(id);
        const doc = await reportRef.get();
        if(!doc.exists) {
            res.status(404).send('Report no encontrado');
            return;
        }
        res.status(200).send(doc.id, doc.data());
    }
    catch (error) {
        res.send(error);
    }
});
    

router.put('/reportBug/:id/validar', checkAdmin, async(req, res) =>{
    try {
        const id  = req.params.id;
        if(!id) {
            res.status(400).send('Falta el id del report');
            return;
        }
        const idAdmin = req.userDocument.id;
        const reportRef = db.collection('reportsBugs').doc(id);
        if(!reportRef.exists) {
            res.status(404).send('Report no trobat');
            return;
        }
        await reportRef.update({
            'solucionat':true,
            'administrador': idAdmin
        })
        res.status(200).send('Bug reportat solucionat')
    }
    catch(error) {
        res.send(error)
    }
});

router.delete('/delete/reportBug', checkAdmin, async(req, res) => {
    try {
        const { id } = req.body;
        if(!id) {
            res.status(400).send('Falta el id del reporte');
            return;
        }
        const reportRef = db.collection('reportsBugs').doc(id);
        if(!reportRef.exists) {
            res.status(404).send('Report no encontrado');
            return;
        }
        await reportRef.delete();
        res.status(200).send('OK');
    } catch (error){
        res.send(error);
    }
});

//Operacions de sol·licituds d'organitzador
router.post('/create/solicitudOrganitzador', checkUserAndFetchData, async(req, res) => {
    try {
        const { idActivitat, motiu } = req.body;
        const solictudRef = db.collection('solicitudsOrganitzador');
        const activitatRef = db.collection('users').doc();
        const doc = await activitatRef.get()
        const email = doc.data().email;
        await solictudRef.add({
            'userSolicitant': req.userDocument.id,
            'email': email,
            'idActivitat': idActivitat,
            'motiu': motiu, 
            'atorgat': false,
            'pendent': true,
            'administrador': ''
        })
        res.status(200).send('OK');
    }
    catch (error){
        res.send(error)
    }
});

router.get('/read/solicitudsOrganitzador/pendents', async(req, res) => {
    try {
        const solicitudsRef = db.collection('solicitudsOrganitzador').where('pendent', '==', true);
        const response = await solicitudsRef.get();
        let responsArr = [];
        response.forEach(doc => {
            responsArr.push(doc.data());
        });
        res.status(200).send(responsArr);
    }
    catch (error){
        res.send(error);
    }
});

router.get('/read/solicitudsOrganitzador/otorgades', async(req, res) => {
    try {
        const solicitudsRef = db.collection('solicitudsOrganitzador').where('atorgat', '==', true);
        const response = await solicitudsRef.get();
        let responsArr = [];
        response.forEach(doc => {
            responsArr.push(doc.data());
        });
        res.status(200).send(responsArr);
    }
    catch (error){
        res.send(error);
    }
});

router.get('/read/solicitudsOrganitzador/caducades', async(req, res) => {
    try {
        var date = new Date();
        date = date.toISOString();
        date = date.replace('Z', '');
        const solicitudsRef = db.collection('solicitudsOrganitzador').where('dataFi', '<', date);
        const response = await solicitudsRef.get();
        let responsArr = [];
        response.forEach(doc => {
            responsArr.push(doc.data());
        });
        res.status(200).send(responsArr);
    }
    catch (error){
        res.send(error);
    }
});

router.put('/acceptar/solicitudOrganitzador/:id', async(req, res) => {
    try {
        const id = req.params.id;
        const adminid = req.body.adminid;
        const solicitudRef = db.collection('solicitudsOrganitzador').doc(id);
        /*
        Depenent de com volguem tenir les collections d'organitzadors, activitats i usauris es posarà com calgui

        const doc = await solicitudRef.get();
        const usauriOrganitzador = doc.data().userSolicitant;
        const userRef = db.collection('users').doc(usauriOrganitzador);
        await userRef.update({
            'organitzador': true
        });
        */
        await solicitudRef.update({
            'atorgat': true,
            'pendent': false,
            'administrador': adminid
        })
        res.status(200).send('OK');
    }
    catch (error){
        res.send(error);
    }
});

router.put('/rebutjar/solicitudOrganitzador/:id', async(req, res) => {
    try {
        const id = req.params.id;
        const adminid = req.body.adminid;
        const solicitudRef = db.collection('solicitudsOrganitzador').doc(id);
        await solicitudRef.update({
            'pendent': false,
            'administrador': adminid
        })
        res.status(200).send('OK');
    }
    catch (error){
        res.send(error);
    }
});

module.exports = router;