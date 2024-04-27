const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

const checkUserAndFetchData = require('./middleware').checkUserAndFetchData;
const checkUsername = require('./middleware').checkUsername;
const checkAdmin = require('./middleware').checkAdmin;


//Operacions de reports d'usuaris
router.post('/reportUsuari/create', checkUserAndFetchData, async(req, res) => {
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
            'data_report': new Date().toISOString(),
            'titol': titol
        })
        res.status(200).send('report afegit')
    } catch (error){
        res.status(404).send(error);
    }
});

router.get('/reportsUsuaris/all', checkAdmin, async (req, res) => {
    try {
        const reportsRef = db.collection('reportsUsuaris').orderBy('data_report', 'desc');
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            const resultdata = doc.data();
            resultdata.id = doc.id;
            responseArr.push(resultdata);
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

router.get('/reportsUsuaris/pendents', checkAdmin, async(req, res) => {
    try {
        const reportsRef = db.collection('reportsUsuaris').where('solucionat', '==', false).orderBy('data_report', 'desc');
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            const resultdata = doc.data();
            resultdata.id = doc.id;
            responseArr.push(resultdata);
        });
        res.status(200).send(responseArr);
    } 
    catch (error){
        res.send(error);
    }
});

router.get('/reportsUsuaris/done', checkAdmin, async(req, res) => {
    try {
        const reportsRef = db.collection('reportsUsuaris').where('solucionat', '==', true).orderBy('data_report', 'desc');
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            const resultdata = doc.data();
            resultdata.id = doc.id;
            responseArr.push(resultdata);
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
            res.status(404).send('Reporte no encontrado');
            return;
        }
        const resultdata = doc.data();
        resultdata.id = doc.id;
        res.status(200).send(resultdata);
    } catch (error){
        res.send(error);
    }
});

router.put('/reportsUsuari/:id/solucionar', checkAdmin, async(req, res) => {
    try {
        if(!req.params.id) {
            res.status(400).send('Falta el id del report');
            return;
        }
        const idAdmin = req.userDocument.id;
        const reportRef = db.collection('reportsUsuaris').doc(req.params.id);
        const doc = await reportRef.get();
        if(!doc.exists) {
            res.status(404).send('Reporte no encontrado');
            return;
        }
        await reportRef.update({
            'solucionat': true,
            'administrador': idAdmin
        });
        res.status(200).send('report usuari solucionat');
    } catch (error){
        res.send(error);
    }
});
router.put('/reportsUsuari/:id/nosolucionar', checkAdmin, async(req, res) => {
    try {
        if(!req.params.id) {
            res.status(400).send('Falta el id del report');
            return;
        }
        const reportRef = db.collection('reportsUsuaris').doc(req.params.id);
        const doc = await reportRef.get();
        if(!doc.exists) {
            res.status(404).send('Reporte no encontrado');
            return;
        }
        await reportRef.update({
            'solucionat': false,
            'administrador': ''
        });
        res.status(200).send('report usuari no solucionat');
    } catch (error){
        res.send(error);
    }
});

router.delete('/reportsUsuari/:id/delete', checkAdmin, async(req, res) => {
    try {
        const id = req.params.id;
        if(!id) {
            res.status(400).send('Falta el id del reporte');
            return;
        }
        const reportRef = db.collection('reportsUsuaris').doc(id);
        const doc = await reportRef.get();
        if(!doc.exists) {
            res.status(404).send('Reporte no encontrado');
            return;
        }
        await reportRef.delete();
        res.status(200).send('report usuari eliminat');
    } catch (error){
        res.send(error);
    }
});




//Operacions de reports de bugs
router.post('/reportBug/create', checkUserAndFetchData,  async(req, res) => {
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
            'data_report': new Date().toISOString(),
            'titol': titol
        })
        res.status(200).send('Report de bug creat')
    }
    catch (error){
        res.send(error);
    }
});

router.get('/reportsBug/all', checkAdmin, async (req, res) => {
    try {
        const reportsRef = db.collection('reportsBugs').orderBy('data_report', 'desc');
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            const resultdata = doc.data();
            resultdata.id = doc.id;
            responseArr.push(resultdata);
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

router.get('/reportsBugs/pendents', checkAdmin, async(req, res) => {
    try {
        const reportsRef = db.collection('reportsBugs').where('solucionat', '==', false).orderBy('data_report', 'desc');
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            const resultdata = doc.data();
            resultdata.id = doc.id;
            responseArr.push(resultdata);
        });
        res.status(200).send(responseArr);
    } 
    catch (error){
        res.send(error);
    }
});

router.get('/reportsBugs/done', checkAdmin, async(req, res) => {
    try {
        const reportsRef = db.collection('reportsBugs').where('solucionat', '==', true).orderBy('data_report', 'desc');
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            const resultdata = doc.data();
            resultdata.id = doc.id;
            responseArr.push(resultdata);
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
            res.status(404).send('Reporte no encontrado');
            return;
        }
        const resultdata = doc.data();
        resultdata.id = doc.id;
        res.status(200).send(resultdata);
    }
    catch (error) {
        res.send(error);
    }
});
    

router.put('/reportsBug/:id/solucionar', checkAdmin, async(req, res) =>{
    try {
        const id  = req.params.id;
        if(!id) {
            res.status(400).send('Falta el id del report');
            return;
        }
        const idAdmin = req.userDocument.id;
        const reportRef = db.collection('reportsBugs').doc(id);
        const doc = await reportRef.get();
        if(!doc.exists) {
            res.status(404).send('Reporte no encontrado');
            return;
        }
        await reportRef.update({
            'solucionat':true,
            'administrador': idAdmin
        })
        res.status(200).send('Bug reportado solucionado')
    }
    catch(error) {
        res.send(error)
    }
});

router.put('/reportsBug/:id/nosolucionar', checkAdmin, async(req, res) => {
    try {
        const id = req.params.id;
        if(!id) {
            res.status(400).send('Falta el id del report');
            return;
        }
        const reportRef = db.collection('reportsBugs').doc(id);
        const doc = await reportRef.get();
        if(!doc.exists) {
            res.status(404).send('Reporte no encontrado');
            return;
        }
        await reportRef.update({
            'solucionat': false,
            'administrador': ''
        })
        res.status(200).send('Bug reportado no solucionado')
    }
    catch (error){
        res.send(error);
    }
});

router.delete('/reportsBug/:id/delete', checkAdmin, async(req, res) => {
    try {
        const  id = req.params.id;
        if(!id) {
            res.status(400).send('Falta el id del reporte');
            return;
        }
        const reportRef = db.collection('reportsBugs').doc(id);
        const doc = await reportRef.get();
        if(!doc.exists) {
            res.status(404).send('Reporte no encontrado');
            return;
        }
        await reportRef.delete();
        res.status(200).send('report bug eliminat');
    } catch (error){
        res.send(error);
    }
});




//Operacions de sol·licituds d'organitzador
router.post('/solicitudsOrganitzador/create', checkUserAndFetchData, async(req, res) => {
    try {
        const {titol, idActivitat, motiu } = req.body;
        if(!idActivitat || !motiu) {
            res.status(400).send('Faltan atributos');
            return;
        }
        const activitatRef = db.collection('activitats').doc(idActivitat);
        const docAct = await activitatRef.get();
        if(!docAct.exists) {
            res.status(404).send('Activitat no encontrada');
            return;
        }
        const solictudRef = db.collection('solicitudsOrganitzador');
        await solictudRef.add({
            'userSolicitant': req.userDocument.id,
            'email': req.userDocument.email,
            'idActivitat': idActivitat,
            'motiu': motiu, 
            'atorgat': false,
            'pendent': true,
            'administrador': '',
            'titol': titol,
            'data_sol': new Date().toISOString(),
        })
        res.status(200).send('sol·licitud d\'organitzador creada');
    }
    catch (error){
        res.send(error)
    }
});

router.get('/solicitudsOrganitzador/pendents', checkAdmin, async(req, res) => {
    try {
        const solicitudsRef = db.collection('solicitudsOrganitzador').where('pendent', '==', true).orderBy('data_sol', 'desc');
        const response = await solicitudsRef.get();
        let responsArr = [];
        response.forEach(doc => {
            const resultdata = doc.data();
            resultdata.id = doc.id;
            responseArr.push(resultdata);
        });
        res.status(200).send(responsArr);
    }
    catch (error){
        res.send(error);
    }
});

router.get('/solicitudsOrganitzador/acceptades', checkAdmin, async(req, res) => {
    try {
        const solicitudsRef = db.collection('solicitudsOrganitzador').where('atorgat', '==', true).orderBy('data_sol', 'desc');
        const response = await solicitudsRef.get();
        let responsArr = [];
        response.forEach(doc => {
            const resultdata = doc.data();
            resultdata.id = doc.id;
            responseArr.push(resultdata);
        });
        res.status(200).send(responsArr);
    }
    catch (error){
        res.send(error);
    }
});

router.get('/solicitudsOrganitzador/:id', checkAdmin, async(req, res) => {
    try {
        const id = req.params.id;
        if(!id) {
            res.status(400).send('Falta el id de la solicitud');
            return;
        }
        const solicitudRef = db.collection('solicitudsOrganitzador').doc(id);
        const doc = await solicitudRef.get();
        if(!doc.exists) {
            res.status(404).send('Solicitud no encontrada');
            return;
        } 
        const resultdata = doc.data();
        resultdata.id = doc.id;
        res.status(200).send(resultdata);
    }
    catch (error){
        res.send(error);
    }
});

router.post('/solicitudOrganitzador/:id/acceptar', checkAdmin, async(req, res) => {
    try {
        const id = req.params.id;
        const solicitudRef = db.collection('solicitudsOrganitzador').doc(id);
        const doc = await solicitudRef.get();
        if(!doc.exists) {
            res.status(404).send('Solicitud no encontrada');
            return;
        }
        const sol = solicitudRef.get();
        const userRef = db.collection('usuaris').doc(sol.data().userSolicitant);
        if(!userRef.exists) {
            res.status(404).send('Usuario no encontrado');
            return;
        }
        const userdoc = await userRef.get();
        const organitzadorRef = db.collection('organitzadors');
        await organitzadorRef.add({
            'user': sol.data().userSolicitant,
            'email': userdoc.data().email,
            'activitats': sol.data().idActivitat,
        });

        await solicitudRef.update({
            'atorgat': true,
            'pendent': false,
            'administrador': req.userDocument.id,
        })
        res.status(200).send('sol·licitud d\'organitzador acceptada');
    }
    catch (error){
        res.send(error);
    }
});

router.put('/solicitudOrganitzador/:id/rebutjar', checkAdmin, async(req, res) => {
    try {
        const id = req.params.id;
        const solicitudRef = db.collection('solicitudsOrganitzador').doc(id);
        const doc = await solicitudRef.get();
        if(!doc.exists) {
            res.status(404).send('Solicitud no encontrada');
            return;
        }
        await solicitudRef.update({
            'pendent': false,
            'administrador': req.userDocument.id,
        })
        res.status(200).send('sol·licitud d\'organitzador rebutjada');
    }
    catch (error){
        res.send(error);
    }
});

module.exports = router;