const db = require('../firebaseConfig').db;
require('dotenv').config();

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');

function decrypt(text) {
    let encryptedText = Buffer.from(text, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

function decryptToken(token, res) {
    let decryptedUid;
    try {
        decryptedUid = decrypt(token);
    } catch (error) {
        res.status(401).send('Token inválido');
        return false;
    }
    return decryptedUid;
}

async function checkUserAndFetchData(req, res, next) { 
    const token = req.headers.authorization?.split(' ')[1];

    const decryptedUid = decryptToken(token, res);
    if (!decryptedUid) return;

    const userRef = db.collection('usuaris').doc(decryptedUid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        return res.status(404).send('Usuario que envio la solicitud no encontrado');
    }

    req.userDocument = userDoc;
    next();
}

async function checkUsername(username, res, message) {

    const userSnapshot = await db.collection('usuaris').where('username', '==', username).get();

    if (userSnapshot.empty) {
        return res.status(404).send(message);
    }
}

async function checkAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    const decryptedUid = decryptToken(token, res);
    if (!decryptedUid) return;
    const userRef = db.collection('administradors').doc(decryptedUid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        return res.status(404).send('Admin no encontrado');
    }

    req.userDocument = userDoc;
    next();
}

module.exports.checkUserAndFetchData = checkUserAndFetchData;
module.exports.checkUsername = checkUsername;
module.exports.checkAdmin = checkAdmin;