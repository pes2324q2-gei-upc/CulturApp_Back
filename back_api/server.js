const express = require('express');
const app = express();
const axios = require('axios');

const NodeCache = require("node-cache");
const admin = require("firebase-admin");
require('dotenv').config();

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

app.use(express.json());

app.use(express.urlencoded({extended: true}));

const db = admin.firestore();

const PORT = process.env.PORT || 8080;

// Crear una nueva caché con un TTL estándar y un período de revisión
const myCache = new NodeCache({ stdTTL: 86400, checkperiod: 8700 });

// Función para obtener datos de la API y actualizar Firestore
async function updateDataCacheAndFireStore() {
    try {

        const activityRef = db.collection("actividades").limit(100);
        const response = await activityRef.get();

            let responseArr = [];
            response.forEach(doc => {
            responseArr.push(doc.data());
            });
            myCache.set("actividades", responseArr);
            
            await updateFireStore(responseArr);
    } catch (error) {
        console.error('Error al obtener datos desde la API:', error.message);
    }
}

// Evento que se dispara cuando un elemento de la caché expira
myCache.on("expired", function(key, value) {
    console.log(`El elemento con la clave ${key} ha expirado, actualizando datos...`);
    updateDataCacheAndFireStore();
});

app.post('/create', async (req, res) => {
    try{
        const id = req.body.name;
        const activityJson = {
            name: req.body.name,
            data: req.body.data
        };
        const response = db.collection("actividades").doc(id).set(activityJson);
        res.send(response);
    } catch (error) {
        res.send(error);
    }
});

app.get('/read/all', async (req, res) => {
    try {

        const activityRef = db.collection("actividades").limit(100);
        const response = await activityRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

//Obtener 1 documento
app.get('/read/:id', async (req, res) => {
    try {
        const activityRef = db.collection("actividades").doc(req.params.id);
        const response = await activityRef.get();
        res.send(response.data());
    } catch (error){
        res.send(error);
    }
});

app.get('/activitats/agenda/json', async (req, res) => {
    try {

        var url = 'https://analisi.transparenciacatalunya.cat/resource/rhpv-yr4f.json';
        // Realizar la solicitud GET a la API utilizando axios
        const response = await axios.get(url);

        // Verificar si la respuesta fue exitosa (código de respuesta 200)
        if (response.status === 200) {
            // Obtener los datos JSON de la respuesta/read/all
            res.send(response.data);
        } else {
            // Si la solicitud no fue exitosa, mostrar mensaje de error
            console.error(`Error al obtener datos desde la API. Código de respuesta: ${response.status}`);
            return null;
        }
    } catch (error) {
        // Manejar cualquier error que ocurra durante la solicitud
        console.error('Error al obtener datos desde la API:', error.message);
        return null;
    }
});

app.get('/activitats/cache', async (req,  res) => {
    res.status(200).send(myCache.get("actividades"));
});

app.get('/activitats/categoria', async (req, res) => {
    try {
        var cats = req.params.categorias;
        const activityRef = db.collection("actividades").where('tags_categor_es', 'array-contains-any', cats);
        const response = await activityRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

app.get('/activitats/date/:date', async (req, res) => {
    try {
        var date = req.params.date;
        date = date.slice(0, -4);
        date = date.replace(' ', 'T');
        const activityRef = db.collection("actividades").where('data_inici', '>=', date)
                            .where('data_inici', '!=', 'No disponible')//.where('data_inici', '!=', '9999-09-09T00:00:00.000');
        const response = await activityRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

app.get('/activitats/name/:name', async (req, res) => {
    try {
        var nomAct = req.params.name;
        const activityRef = db.collection("actividades").where('denominaci', '==', nomAct);
        const response = await activityRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

app.get('/user/activitats/:id/search/:name', async (req, res) => {
    try {
        var id = req.params.id;
        var name = req.params.name;

        const docRef = db.collection('users').doc(id);
        const response = await docRef.get();

        let responseArr = await Promise.all(response.data().activities.map(async activity => {
            const activityRef = db.collection("actividades").doc(activity);
            const responseAct = await activityRef.get();
            let activityData = responseAct.data();

            // Check if the activity has the specified name
            if (activityData.denominaci === name) {
                return activityData;
            } else {
                return null; // If activity doesn't match the name, return null
            }
        }));

        // Filter out null values (activities that don't match the name)
        responseArr = responseArr.filter(activity => activity !== null);
        
        console.log(responseArr)
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

app.get('/user/exists', async (req, res) => {
    try {
        var uid = req.query.uid;

        const docRef = db.collection('users').doc(uid);

        docRef.get()
        .then(doc => {
            if (doc.exists) {
                res.status(200).send("exists");
            } else {
                res.status(200).send("notexists");
            }
        })
        .catch(error => {
            res.send(error);
        });
    } catch (error) {
    }
});

app.get('/user/activitats/:id', async (req, res) => {
    try {
        var id = req.params.id;
        const docRef = db.collection('users').doc(id);
        const response = await docRef.get();

        let responseArr = await Promise.all(response.data().activities.map(async activity => {
            const activityRef = db.collection("actividades").doc(activity);
            const responseAct = await activityRef.get();
            return responseAct.data();
        }));
        

        console.log(responseArr)
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

app.post('/users/create', async(req, res) => {
    try {

        const { uid, username, email, favcategories } = req.body;

        const categories = JSON.parse(favcategories);

        const usersCollection = admin.firestore().collection('users');

        const activities = [];

        await usersCollection.doc(uid).set({
          'email': email,
          'username': username,
          'favcategories': categories,
          'activities': activities
        });

        res.status(200).send('OK');
    }
    catch (error){
        res.send(error);
    }
});

app.get('/users/:uid/favcategories', async (req, res) => {
    try {
        const uid = req.params.uid;
        const userDoc = await admin.firestore().collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).send('Usuario no encontrado');
        }

        const userData = userDoc.data();
        const favCategories = userData.favcategories;

        res.status(200).json(favCategories);
    } catch (error) {
        console.error('Error al obtener las categorías favoritas del usuario:', error);
        res.status(500).send('Error interno del servidor');
    }
});

app.post('/activitats/signup', async(req, res) => {
    try {
        const { uid, activityId } = req.body;
        const userRef = db.collection('users').doc(uid);
        const userSnapshot = await userRef.get();
    
        if (userSnapshot.exists) {
          const activities = userSnapshot.data().activities || [];
    
          if (!activities.includes(activityId)) {
            activities.push(activityId);
            await userRef.update({ activities: activities });
          }
        } else {
            res.send("El usuario no existe");
        }
        res.status(200).send("Ok");
      } catch (error) {
        res.send(error);
    }
});

app.post('/activitats/signout', async(req, res) => {
    try {
        const { uid, activityId } = req.body;
        const userRef = db.collection('users').doc(uid);
        const userSnapshot = await userRef.get();
    
        if (userSnapshot.exists) {
          const activities = userSnapshot.data().activities || [];
    
          const index = activities.indexOf(activityId);
          if (index !== -1) activities.splice(index, 1);
          await userRef.update({ activities: activities });
        }
        res.status(200).send("Ok");
      } catch (error) {
        res.send(error);
    }
});

app.get('/activitats/isuserin', async (req, res) => {
    try {
        var uid = req.query.uid;
        var activityId = req.query.activityId;
        const userRef = db.collection('users').doc(uid);
        const userSnapshot = await userRef.get();
    
        if (userSnapshot.exists) {
          const activities = userSnapshot.data().activities || [];
    
          if (activities.includes(activityId)) {
            res.status(200).send("yes");
          } else {
            res.status(200).send("no");
          }
        } else {
            res.status(200).send("no");
        }
    } catch (error){
        res.send(error);
    }
});

app.get('/user/uniqueUsername', async (req, res) => {
    try {
        var username = req.query.username;

        const usersRef = db.collection('users');
        
        const querySnapshot = await usersRef.where('username', '==', username).get();

        if (!querySnapshot.empty) {
            res.status(200).send("notunique");
        } else {
            res.status(200).send("unique");
        }
    } catch (error) {
        res.status(500).send(error); 
    }
});

app.listen(PORT, async () => {
    // Inicializar la caché con datos por primera vez
    await updateDataCacheAndFireStore();
    console.log(`Server is working on PORT ${PORT}`);
});



