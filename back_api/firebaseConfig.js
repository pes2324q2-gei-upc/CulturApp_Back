const admin = require('firebase-admin');
require('dotenv').config();

let db, auth;

if(process.env.NODE_ENV !== 'test') { //Si no estamos en modo test, inicializamos Firebase Admin. Si estamos en modo test ya el setup.js inicializará una Test App

    // Inicializa Firebase Admin
    admin.initializeApp({
        credential: admin.credential.cert({
            type: process.env.TYPE,
            project_id: process.env.PROJECT_ID,
            private_key_id: process.env.PRIVATE_KEY_ID,
            private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.CLIENT_EMAIL,
            client_id: process.env.CLIENT_ID,
            auth_uri: process.env.AUTH_URI,
            token_uri: process.env.TOKEN_URI,
            auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: process.env.CLIENT_X509_CERT_URL
        })
    });

    db =  admin.firestore(); 
    auth = admin.auth();
} else {
    // Estamos en un entorno de test, por lo que db debería ser la instancia de test
    const firebase = require('@firebase/testing');
    const app = firebase.initializeTestApp({ projectId: 'your-project-id' });
    db = app.firestore();
}

module.exports = { db, auth };

/*
const db = process.env.NODE_ENV === 'development'
    ? admin.firestore().settings({ host: 'localhost:8080', ssl: false })
    : admin.firestore();
*/