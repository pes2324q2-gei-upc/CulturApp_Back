const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

router.post('/create', async(req, res) => {
   
    try{
        const { uid, friend } = req.body;
        console.log(0)
        if(uid != friend){
            console.log(1)
            const followingCollection = db.collection('following');
            console.log(2)
            await followingCollection.add({
                'user': uid,
                'friend': friend,
                'acceptat': false,
                'pendent': true
            });
            console.log(3)
            res.status(200).send('OK');
        }
        else {
            res.status(400).send('No pots afegir-te a tu mateix com a amic');
        }
    }   
    catch(error){
        res.send(error);
    }
    
});

router.get('/:id/following', async (req, res) => {
    try {
        var id = req.params.id;
        console.log(id);
        const docRef = db.collection('following').where('user', '==', id).where('acceptat', '==', true);
        const response = await docRef.get();
        let responseArr = [];
        
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

router.get('/:id/followers', async (req, res) => {
    
    try {
        const id = req.params.id;
        const followersRef = db.collection('following').where('friend', '==', id).where('acceptat', '==', true);
        const response = await followersRef.get();
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

router.put('/accept/:id', async(req, res) =>{
    try {
        const id  = req.params.id;
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

router.put('/rebutjar/:id', async(req, res) =>{
    try {
        var id = req.params.id;
        const amicsRef = db.collection('following').doc(id);
        await amicsRef.update({
            'pendent': false
        });
        res.status(200).send('OK');
    }
    catch (error) {
        res.send(error);
    }
});

router.get('/pendents/:id', async(req, res) => { 
    try {
        const id = req.params.id;
        const amicsRef = db.collection('following').where('friend', '==', id).where('pendent', '==', true);
        const response = await amicsRef.get();
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



module.exports = router