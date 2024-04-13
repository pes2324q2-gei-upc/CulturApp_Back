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
                'friend': friend 
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
        const docRef = db.collection('following').where('user', '==', id);
        const response = await docRef.get();
        let responseArr = [];
        
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        console.log(responseArr);
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

module.exports = router