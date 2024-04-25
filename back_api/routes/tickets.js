const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);

function decrypt(text) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

router.post('/create/reportUsuari', async(req, res) => {
    try {
        const { uid, report, usuariReportat } = req.body;

        // Desencriptar el uid
        const decryptedUid = decrypt(uid);

        // Comprobar que decryptedUid es el id de un documento de la colección 'usuaris'
        const userRef = db.collection('usuaris').doc(decryptedUid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            res.status(404).send('Usuario no encontrado');
            return;
        }

        // Buscar el documento con el atributo 'username' igual a 'usuariReportat'
        const userSnapshot = await db.collection('usuaris').where('username', '==', usuariReportat).get();

        // Si no se encontró el usuario, enviar un error
        if (userSnapshot.empty) {
            res.status(404).send('Usuario no encontrado');
            return;
        }

        // Obtener el id del primer (y único) documento encontrado
        const reportedUserId = userSnapshot.docs[0].id;

        const reportsCollection = db.collection('reportsUsuaris');

        await reportsCollection.add({
            'user': decryptedUid,
            'motiuReport': report,
            'usuariReportat': reportedUserId,
            'solucionat': false,
            'administrador': ''
        })
        res.status(200).send('OK')
    }
    catch (error){
        res.send(error);
    }
});

router.get('/read/reportsUsuari/all', async (req, res) => {
    try {
        const reportsRef = db.collection('reportsUsuaris');
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

router.get('/read/reportsUsuaris/pendents', async(req, res) => {
    try {
        const reportsRef = db.collection('reportsUsuaris').where('solucionat', '==', false);
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } 
    catch (error){
        res.send(error);
    }
});

router.get('/read/reportsUsuaris/solucionats', async(req, res) => {
    try {
        const reportsRef = db.collection('reportsUsuaris').where('solucionat', '==', true)
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    }
    catch (error){
        res.send(error);
    }
});

router.get('/reportsUsuari/solucionat/admin/:id', async(req, res) => {
    try {
        const id = req.params.id;
        const reportsRef = db.collection('reportsUsuaris').where('solucionat', '==', true).where('administrador', '==', id);   
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    }
    catch (error){
        res.send(error);
    }
});

router.put('/solucionat/reportUsuari/:id', async(req, res) => {
    try {
        const id  = req.params.id;
        const idAdmin = req.body.idAdmin;
        const reportRef = db.collection('reportsUsuaris').doc(id);
        await reportRef.update({
            'solucionat': true,
            'administrador': idAdmin
        });
        res.status(200).send('OK');
    } catch (error){
        res.send(error);
    }
});

router.delete('/delete/reportUsuari', async(req, res) => {
    try {
        const { id } = req.body;
        const reportRef = db.collection('reportsUsuaris').doc(id);
        await reportRef.delete();
        res.status(200).send('OK');
    } catch (error){
        res.send(error);
    }
});

//Operacions de reports de bugs
router.post('/create/reportBug', async(req, res) => {
    try {
        const { uid, report } = req.body;

        const reportsCollection = db.collection('reportsBugs');

        await reportsCollection.add({
            'user': uid,
            'errorApp': report,
            'solucionat': false,
            'administrador': ''
        })
        res.status(200).send('OK')
    }
    catch (error){
        res.send(error);
    }
});

router.get('/read/reportsBug/all', async (req, res) => {
    try {
        const reportsRef = db.collection('reportsBugs');
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

router.get('/read/reportsBugs/pendents', async(req, res) => {
    try {
        const reportsRef = db.collection('reportsBugs').where('solucionat', '==', false);
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } 
    catch (error){
        res.send(error);
    }
});

router.get('/read/reportsBugs/solucionats', async(req, res) => {
    try {
        const reportsRef = db.collection('reportsBugs').where('solucionat', '==', true);
        const response = await reportsRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } 
    catch (error){
        res.send(error);
    }
});

router.put('/solucionat/reportBug/:id', async(req, res) =>{
    try {
        const id  = req.params.id;
        const idAdmin = req.body.idAdmin;
        const reportRef = db.collection('reportsBugs').doc(id);
        await reportRef.update({
            'solucionat':true,
            'administrador': idAdmin
        })
        res.status(200).send('OK')
    }
    catch(error) {
        res.send(error)
    }
});

router.delete('/delete/reportBug', async(req, res) => {
    try {
        const { id } = req.body;
        const reportRef = db.collection('reportsBugs').doc(id);
        await reportRef.delete();
        res.status(200).send('OK');
    } catch (error){
        res.send(error);
    }
});

//Operacions de sol·licituds d'organitzador
router.post('/create/solicitudOrganitzador', async(req, res) => {
    try {
        const { uid, idActivitat, motiu } = req.body;
        const solictudRef = db.collection('solicitudsOrganitzador');
        const activitatRef = db.collection('users').doc(uid);
        const doc = await activitatRef.get()
        const email = doc.data().email;
        await solictudRef.add({
            'userSolicitant': uid,
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