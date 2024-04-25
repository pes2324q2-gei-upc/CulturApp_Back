const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function decrypt(text) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

function isHexadecimal(str) {
    return /^[0-9A-Fa-f]+$/.test(str.iv);
}

router.post('/create', async(req, res) => {
    try{
        const { token, friend } = req.body;

        if (!token || !friend) {
            res.status(400).send('Faltan atributos');
            return;
        }

        if(!isHexadecimal(token)){
            res.status(401).send('El token no es hexadecimal');
            return;
        }

        const decryptedUid = decrypt(token);

        const userRef = db.collection('usuaris').doc(decryptedUid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            res.status(404).send('Usuario que hace la solicitud no encontrado');
            return;
        }

        const userSnapshot = await db.collection('usuaris').where('username', '==', friend).get();

        if (userSnapshot.empty) {
            res.status(404).send('Usuario que recibe la solicitud no encontrado');
            return;
        }

        const friendUid = userSnapshot.docs[0].id;

        if(decryptedUid == friendUid){
            res.status(400).send('No puedes seguirte a ti mismo');
            return;
        }

        const followingCollection = db.collection('following');
        const existingRequest = await followingCollection.where('user', '==', decryptedUid).where('friend', '==', friendUid).get();

        if (!existingRequest.empty) {
            res.status(409).send('La solicitud ya ha sido enviada');
            return;
        }

        await followingCollection.add({
            'user': decryptedUid,
            'friend': friendUid,
            'acceptat': false,
            'pendent': true
        });
        res.status(200).send('OK');            
        
    }   
    catch(error){
        res.status(404).send(error);
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