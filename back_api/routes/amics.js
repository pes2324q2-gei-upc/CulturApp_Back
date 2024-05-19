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

        let idreq = await checkUsername(friend, res, 'Usuario que recibe la solicitud no encontrado');
        if(!idreq) return;

        const friendid = idreq.docs[0].id
        
        const userid = req.userDocument.id;
        
        if(userid == friendid){
            res.status(400).send('No puedes seguirte a ti mismo');
            return;
        }

        const followingCollection = db.collection('following');
        const existingRequest = await followingCollection.where('user', '==', userid).where('friend', '==', friendid).get();

        if (!existingRequest.empty) {
            res.status(409).send('La solicitud ya ha sido enviada');
            return;
        }

        await followingCollection.add({
            'user': userid,
            'friend': friendid,
            'data_follow': new Date().toISOString(),
            'acceptat': false,
            'pendent': true
        });
        res.status(200).send('OK');            
        
    }   
    catch(error){
        res.status(404).send(error);
    }
    
});


router.put('/accept/:id', checkUserAndFetchData, async (req, res) => {
    try {
        const username_acceptance = req.params.id;
        
        const userid = req.userDocument.id;

        let idreq = await checkUsername(username_acceptance, res, 'Usuario no encontrado');
        if(!idreq) return;

        const requesterid = idreq.docs[0].id

        if(requesterid == userid){
            res.status(400).send('No puedes aceptarte a ti mismo');
            return;
        }
        

        const followingRef = db.collection('following');
        const existingRequest = await followingRef.where('user', '==', requesterid).where('friend', '==', userid).get();

        if (existingRequest.empty) {
            res.status(404).send('No se ha encontrado la solicitud de amistad');
            return;
        }

        const requestDoc = existingRequest.docs[0];

        if (requestDoc.data().acceptat) {

            res.status(409).send('La solicitud de amistad ya ha sido aceptada');
            return;
        }

        await followingRef.doc(requestDoc.id).update({
            'acceptat': true,
            'pendent': false
        });

        res.status(200).send('OK');
    } catch (error) {
        res.status(404).send(error);
    }
});

router.delete('/delete/:id', checkUserAndFetchData, async(req, res) =>{
    try {

        const username_delete = req.params.id;

       
        let idreq = await checkUsername(username_delete, res, 'Usuario no encontrado');
        if(!idreq) return;

        const requesterid = idreq.docs[0].id
        const userid = req.userDocument.id;


        if(requesterid == userid){
            res.status(400).send('No puedes rechazarte a ti mismo');
            return;
        }

        const followingRef = db.collection('following');
        const existingRequest = await followingRef.where('user', '==', requesterid).where('friend', '==', userid).get();

        if (existingRequest.empty) {
            res.status(404).send('No se ha encontrado la solicitud de amistad');
            return;
        }

        const requestDoc = existingRequest.docs[0];

        await followingRef.doc(requestDoc.id).delete();

        res.status(200).send('OK');
    } catch (error) {
        res.status(404).send(error);
    }
});


router.delete('/deleteFollowing/:id', checkUserAndFetchData, async(req, res) =>{
    try {

        const username_delete = req.params.id;

        let idreq = await checkUsername(username_delete, res, 'Usuario no encontrado');
        if(!idreq) return;

        const username_deleteid = idreq.docs[0].id
        const userid = req.userDocument.id;


        if(username_deleteid == userid){
            res.status(400).send('No puedes eliminarte a ti mismo');
            return;
        }

        const followingRef = db.collection('following');
        const existingRequest = await followingRef.where('user', '==', userid).where('friend', '==', username_deleteid).get();

        if (existingRequest.empty) {
            res.status(404).send('No se ha encontrado la solicitud de amistad');
            return;
        }

        const requestDoc = existingRequest.docs[0];

        await followingRef.doc(requestDoc.id).delete();

        res.status(200).send('OK');
    } catch (error) {
        res.status(404).send(error);
    }
});

async function fetchUsers(username, field_user, type, value) {
    const docRef = db.collection('following').where(field_user, '==', username).where(type, '==', true).orderBy('data_follow', 'desc');
    const response = await docRef.get();
    let responseArr = [];

    await Promise.all(response.docs.map(async doc => {
        let userData = {};
        userData.user = (await db.collection('users').doc(doc.data().user).get()).data().username;
        userData.friend = (await db.collection('users').doc(doc.data().friend).get()).data().username;
        responseArr.push(userData);
    }));

    return responseArr;
}

router.get('/:id/following', checkUserAndFetchData, async (req, res) => {
    try {
        const username_followings = req.params.id;

        let idreq = await checkUsername(username_followings, res, 'Usuario no encontrado');
        if(!idreq) return;

        const username_followingsid = idreq.docs[0].id
        const responseArr = await fetchUsers(username_followingsid, 'user', 'acceptat', 'friend');
        res.status(200).send(responseArr);
        

    } catch (error){
        res.status(404).send(error);
    }
});

router.get('/:id/followers', checkUserAndFetchData, async (req, res) => {
    try {
        const username_followers = req.params.id;

        let idreq = await checkUsername(username_followers, res, 'Usuario no encontrado');
        if(!idreq) return;
        const username_followersid = idreq.docs[0].id
        const responseArr = await fetchUsers(username_followersid, 'friend', 'acceptat', 'user');
        res.status(200).send(responseArr);

    } catch (error){
        res.status(404).send(error);
    }
});

router.get('/:id/pendents', checkUserAndFetchData, async(req, res) => { 
    try {
        const username_pendents = req.params.id;

        let idreq = await checkUsername(username_pendents, res, 'Usuario no encontrado');
        if(!idreq) return;

        const username_pendentsid = idreq.docs[0].id

        const userid = req.userDocument.id;

        if(username_pendentsid == userid){
            const responseArr = await fetchUsers(username_pendentsid, 'friend', 'pendent', 'user');
            res.status(200).send(responseArr);
        } else {
            res.status(401).send('No tienes permiso para ver los pendientes a aceptar de este usuario');
        }

    } catch (error){
        res.status(404).send(error);
    }
});

router.get('/followingRequests', checkUserAndFetchData, async(req, res) => {
    try {
        const userid = req.userDocument.id;
        const followingRef = db.collection('following').where('user', '==', userid).where('pendent', '==', true);
        const response = await followingRef.get();
        let responseArr = [];
        await Promise.all(response.docs.map(async doc => {
            let userData = {};
            userData.user = (await db.collection('users').doc(doc.data().user).get()).data().username;
            userData.friend = (await db.collection('users').doc(doc.data().friend).get()).data().username;
            responseArr.push(userData);
        }));

        res.status(200).send(responseArr);
    } catch (error) {
        res.status(404).send(error);
    }
});



module.exports = router