const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

router.post('/create', async(req, res) => {
    try {
        const { username, email, password } = req.body
        const adminRef = db.collection('administradors');
        await adminRef.add({
            'username': username,
            'email': email,
            'password': password
        })
        res.status(200).send('OK')
    }
    catch (error){
        res.send(error);
    }
});

router.post('/login', async(req, res) => {  
    try {
        const { username, password } = req.body;
        console.log("goes in with" + username + " " + password)
        const adminRef = db.collection('administradors');
        const response = await adminRef.where('username', '==', username).get()
        if (response.empty) {
            res.status(200).send('Usuari no trobat')
        }
        else {
            if(password === response.docs[0].data().password){
                res.status(200).send('OK')
            }
            else {
                res.status(200).send('Contrasenya incorrecta')
            }
        }
    }
    catch (error){
        res.send(error);
    }
});



module.exports = router;