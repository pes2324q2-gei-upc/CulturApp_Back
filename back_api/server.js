
const app = require('./app');
const axios = require('axios');

const NodeCache = require("node-cache");
const admin = require("firebase-admin");
require('dotenv').config();

const{db, auth} = require('./firebaseConfig');

//app.use(express.json());

//app.use(express.urlencoded({extended: true}));



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

/*app.post('/create', async (req, res) => {
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
});*/



//Obtener 1 documento
app.get('/activitats/cache', async (req,  res) => {
    res.status(200).send(myCache.get("actividades"));
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
          'favcategories': categories,
          'activities': []
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


app.listen(PORT, async () => {
    // Inicializar la caché con datos por primera vez
    await updateDataCacheAndFireStore();
    console.log(`Server is working on PORT ${PORT}`);
});



