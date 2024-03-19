const express = require('express');
const app = express();
const axios = require('axios');


const NodeCache = require("node-cache");

const admin = require("firebase-admin");
const credentials = require("./key.json");

admin.initializeApp({
    credential: admin.credential.cert(credentials)
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
        // Realizar la solicitud GET a la API utilizando axios
        //const response = await axios.get('https://analisi.transparenciacatalunya.cat/resource/rhpv-yr4f.json');
        // Verificar si la respuesta fue exitosa (código de respuesta 200)
        const activityRef = db.collection("actividades").limit(100);
        const response = await activityRef.get();
        //if (response.status === 200) {
            // Obtener los datos JSON de la respuesta
            //const data = response.data;
            // Actualizar la caché con los nuevos datos
            let responseArr = [];
            response.forEach(doc => {
            responseArr.push(doc.data());
            });
            myCache.set("actividades", responseArr);
            
            await updateFireStore(responseArr);

        //} else {
            //console.error(`Error al obtener datos desde la API. Código de respuesta: ${response.status}`);
        //}
    } catch (error) {
        console.error('Error al obtener datos desde la API:', error.message);
    }
}

async function updateFireStore() {
    //logica actualizar FireStore con el JSON obtenido.
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
        
        /*const today = new Date();
        var d = today.getFullYear();
        if (today.getMonth() < 10) {
            d += '0' + (today.getMonth() - 1);
        } else { 
            d += '-' + (today.getMonth() - 1);
        }
        if (today.getDay() < 10) {
            d += '0' + today.getDay();
        } else { 
            d += '' + today.getDay();
        }
        d += '000';
        const where = '?$where=codi>=' + d.toString();
        url += where;*/
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

        /*
        for(let i = 0; i < response.data().activities.lenght; ++i) {
            const activityRef = db.collection("actividades").doc(response.data().activities[i]);
            const responseAct = await activityRef.get();
            responseArr.push(responseAct.data())
            console.log(responseArr)
        }
        */


        /*
        response.data().activities.forEach(async activity => {
            const activityRef = db.collection("actividades").doc(activity);
            const responseAct = await activityRef.get();
            responseArr.push(responseAct.data())
            console.log(responseArr)
        })
        */

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

        await usersCollection.doc(uid).set({
          'email': email,
          'username': username,
          'favcategories': categories
        });

        res.status(200).send('OK');
    }
    catch (error){
        res.send(error);
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

/*app.post('/update', async(req, res) => {
    try {
        const id = req.body.id;
        const newData = "newDATA!"
        const activityRef = await db.collection("actividades").doc(id)
        .update({
            data: newData
        });
        res.send(response.data());
    }
    catch (error){
        res.send(error);
    }
});*/

/*app.delete('/delete/:id', async(req, res) => {
    try {
        const response = await db.collection("actividades").doc(req.params.id).delete();
        res.send(response.data());
    }
    catch (error){
        res.send(error);
    }
});*/

app.listen(PORT, async () => {
    // Inicializar la caché con datos por primera vez
    await updateDataCacheAndFireStore();
    console.log(`Server is working on PORT ${PORT}`);
});

