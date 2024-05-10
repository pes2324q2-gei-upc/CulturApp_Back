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

        if (!(await checkUsername(username_acceptance, res, 'Usuario no encontrado'))) return;

        const username_request = req.userDocument.data().username;

        if(username_acceptance == username_request){
            res.status(400).send('No puedes aceptarte a ti mismo');
            return;
        }

        const followingRef = db.collection('following');
        const existingRequest = await followingRef.where('user', '==', username_acceptance).where('friend', '==', username_request).get();

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

        if (!(await checkUsername(username_delete, res, 'Usuario no encontrado'))) return;

        const username_request = req.userDocument.data().username;

        if(username_delete == username_request){
            res.status(400).send('No puedes rechazarte a ti mismo');
            return;
        }

        const followingRef = db.collection('following');
        const existingRequest = await followingRef.where('user', '==', username_delete).where('friend', '==', username_request).get();

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

        if (!(await checkUsername(username_delete, res, 'Usuario no encontrado'))) return;

        const username_request = req.userDocument.data().username;

        if(username_delete == username_request){
            res.status(400).send('No puedes eliminarte a ti mismo');
            return;
        }

        const followingRef = db.collection('following');
        const existingRequest = await followingRef.where('user', '==', username_request).where('friend', '==', username_delete).get();

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

async function isHisFriend(friend, username){
    const docRef = db.collection('following').where('user', '==', username).where('friend', '==', friend).where('acceptat', '==', true);
    const response = await docRef.get();
    return !response.empty;
}

async function fetchUsers(username, field_user, type, value) {
    const docRef = db.collection('following').where(field_user, '==', username).where(type, '==', true).orderBy('data_follow', 'desc');
    const response = await docRef.get();
    let responseArr = [];
    
    response.forEach(doc => {
        responseArr.push(doc.data());
    });

    return responseArr;
}

router.get('/:id/following', checkUserAndFetchData, async (req, res) => {
    try {
        const username_followings = req.params.id;

        if(!(await checkUsername(username_followings, res, 'Usuario no encontrado'))) return;

        const username_request = req.userDocument.data().username;

        if((username_followings == username_request) || (await isHisFriend(username_request, username_followings ))){
            const responseArr = await fetchUsers(username_followings, 'user', 'acceptat', 'friend');
            res.status(200).send(responseArr);
        } else {
            res.status(401).send('No tienes permiso para ver a los seguidos de este usuario');
        }

    } catch (error){
        res.status(404).send(error);
    }
});

router.get('/:id/followers', checkUserAndFetchData, async (req, res) => {
    try {
        const username_followers = req.params.id;

        if(!(await checkUsername(username_followers, res, 'Usuario no encontrado'))) return;

        const username_request = req.userDocument.data().username;

        if((username_followers == username_request) || (await isHisFriend(username_request, username_followers ))){
            const responseArr = await fetchUsers(username_followers, 'friend', 'acceptat', 'user');
            res.status(200).send(responseArr);
        } else {
            res.status(401).send('No tienes permiso para ver a los seguidores de este usuario');
        }

    } catch (error){
        res.status(404).send(error);
    }
});

router.get('/:id/pendents', checkUserAndFetchData, async(req, res) => { 
    try {
        const username_pendents = req.params.id;

        if(!(await checkUsername(username_pendents, res, 'Usuario no encontrado'))) return;

        const username_request = req.userDocument.data().username;

        if(username_pendents == username_request){
            const responseArr = await fetchUsers(username_pendents, 'friend', 'pendent', 'user');
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
        const username = req.userDocument.data().username;
        const followingRef = db.collection('following').where('user', '==', username).where('pendent', '==', true);
        const response = await followingRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });

        res.status(200).send(responseArr);
    } catch (error) {
        res.status(404).send(error);
    }
});



module.exports = router