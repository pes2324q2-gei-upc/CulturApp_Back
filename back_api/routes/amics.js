const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

router.post('/create', async(req, res) => {
   
    try{
        const { uid, friend } = req.body;
        if(uid != friend){
            const followingCollection = db.collection('following');
            await followingCollection.add({
                'user': uid,
                'friend': friend,
                'acceptat': false,
                'pendent': true
            });
            res.status(200).send('OK');
        }
        /* 
            esto de aquí podemos tener el control aquí o en front, depende de como pongamos lo de
            solicitar amistad
        */
        else {
            res.status(400).send('No pots afegir-te a tu mateix com a amic');
        }
    }   
    catch(error){
        res.send(error);
    }
    
});

/*primera idea:
    los amigos a los que sigues son los que tienen tu id en la columna user i acceptat a true
    los amigos que te siguen son los que tienen tu id en la columna friend i acceptat a true
*/
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