const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

const checkUserAndFetchData = require('./middleware').checkUserAndFetchData;
const checkUsername = require('./middleware').checkUsername;


router.post('/create', checkUserAndFetchData, async(req, res) => {
    try{
        const { friend } = req.body;

        if (!friend) {
            res.status(400).send('Faltan atributos');
            return;
        }

        if(!(await checkUsername(friend, res, 'Usuario que recibe la solicitud no encontrado'))) return;
        
        const username_solicitador = req.userDocument.data().username;
        
        if(username_solicitador == friend){
            res.status(400).send('No puedes seguirte a ti mismo');
            return;
        }

        const followingCollection = db.collection('following');
        const existingRequest = await followingCollection.where('user', '==', username_solicitador).where('friend', '==', friend).get();

        if (!existingRequest.empty) {
            res.status(409).send('La solicitud ya ha sido enviada');
            return;
        }

        await followingCollection.add({
            'user': username_solicitador,
            'friend': friend,
            'acceptat': false,
            'pendent': true
        });
        res.status(200).send('OK');            
        
    }   
    catch(error){
        res.status(404).send(error);
    }
    
});

router.put('/accept/:id', async(req, res) =>{
    try {
        const token  = req.params.id;
        const followingRef = db.collection('following').doc(id);
        await followingRef.update({
            'acceptat': true,
            'pendent': false
        });
        res.status(200).send('OK');
    }
    catch (error){
        res.send(error);
    }
});

router.delete('/rebutjar/:id', async(req, res) =>{
    try {
        var id = req.params.id;
        const amicsRef = db.collection('following').doc(id);
        await amicsRef.delete()
        res.status(200).send('OK');
    }
    catch (error) {
        res.send(error);
    }
});

/*primera idea:
    los amigos a los que sigues son los que tienen tu id en la columna user i acceptat a true
    los amigos que te siguen son los que tienen tu id en la columna friend i acceptat a true
*/
router.get('/:id/following', async (req, res) => {
    try {

        const token = req.params.id;

        let decryptedUid;
        try {
            decryptedUid = decrypt(token);
        } catch (error) {
            res.status(401).send('Token no válido');
            return;
        }

        const userRef = db.collection('usuaris').doc(decryptedUid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            res.status(404).send('Usuario no encontrado');
            return;
        }

        const username = userDoc.data().username;

        const docRef = db.collection('following').where('user', '==', username).where('acceptat', '==', true);
        const response = await docRef.get();
        let responseArr = [];
        
        response.forEach(doc => {
            responseArr.push(doc.data().friend);
        });

        res.status(200).send(responseArr);

    } catch (error){
        res.send(error);
    }
});

router.get('/:id/followers', async (req, res) => {
    try {

        const token = req.params.id;

        let decryptedUid;
        try {
            decryptedUid = decrypt(token);
        } catch (error) {
            res.status(401).send('Token no válido');
            return;
        }

        const userRef = db.collection('usuaris').doc(decryptedUid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            res.status(404).send('Usuario no encontrado');
            return;
        }

        const username = userDoc.data().username;

        const followersRef = db.collection('following').where('friend', '==', username).where('acceptat', '==', true);
        const response = await followersRef.get();
        let responseArr = [];

        response.forEach(doc => {
            responseArr.push(doc.data().user);
        });
        res.status(200).send(responseArr);
    }
    catch (error){
        res.send(error);
    }
});

router.get('/:id/pendents/', async(req, res) => { 
    try {

        const token = req.params.id;

        let decryptedUid;
        try {
            decryptedUid = decrypt(token);
        } catch (error) {
            res.status(401).send('Token no válido');
            return;
        }

        const userRef = db.collection('usuaris').doc(decryptedUid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            res.status(404).send('Usuario no encontrado');
            return;
        }

        const username = userDoc.data().username;

        const amicsRef = db.collection('following').where('friend', '==', username).where('pendent', '==', true);
        const response = await amicsRef.get();
        let responseArr = [];

        response.forEach(doc => {
            responseArr.push(doc.data().user);
        });
        res.status(200).send(responseArr);

    }
    catch (error){
        res.send(error);
    }
});



module.exports = router