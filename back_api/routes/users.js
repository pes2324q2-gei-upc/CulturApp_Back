const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');


router.get('/read/users', async (req, res) => {
    try {

        const usersRef = db.collection("users");
        const response = await usersRef.get();
        let responseArr = [];
        response.forEach(doc => {
            responseArr.push(doc.data());
        });
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});

router.post('/create', async(req, res) => {
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

router.get('/:id/activitats', async (req, res) => {
    try {
        var id = req.params.id;
        const docRef = db.collection('users').doc(id);
        const response = await docRef.get();

        let responseArr = await Promise.all(response.data().activities.map(async activity => {
            const activityRef = db.collection("actividades").doc(activity);
            const responseAct = await activityRef.get();
            if(responseAct.exists) {
                return responseAct.data();
            }
            else return null;
        }));
        const filteredActivities = responseArr.filter(activity => activity !== null);
        res.status(200).send(filteredActivities);
        
    } catch (error){
        res.send(error);
    }
});

router.get('/activitats/isuserin', async (req, res) => {
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

router.post('/activitats/signout', async(req, res) => {
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

router.post('/activitats/signup', async(req, res) => {
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

router.get('/:uid/favcategories', async (req, res) => {
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

router.get('/:uid/username', async (req, res) => {
    try {
        const uid = req.params.uid;
        const userDoc = await admin.firestore().collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).send('Usuario no encontrado');
        }

        const userData = userDoc.data();
        const usname = userData.username;

        res.status(200).json(usname);
    } catch (error) {
        console.error('Error al obtener username del usuario:', error);
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/exists', async (req, res) => {
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

router.get('/activitats/:id/search/:name', async (req, res) => {
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
        res.status(200).send(responseArr);
    } catch (error){
        res.send(error);
    }
});


router.get('/uniqueUsername', async (req, res) => {
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

router.get('/:id/categories/:categories', async (req, res) => {
    try {
        var id = req.params.id;
        const codiActivitats =  db.collection('users').doc(id);
        const response = await codiActivitats.get();
        var categories = req.params.categories.split(",");
        let responseArr = await Promise.all(response.data().activities.map(async activity => {
            const activityRef = db.collection("actividades").doc(activity)//.where('tags_categor_es', 'array-contains-any', categories);
            const responseAct = await activityRef.get();
            if(responseAct.data().tags_categor_es.some(r=> categories.includes(r))){
                return responseAct.data();
            } else {
                return null
            }
        }));
        const filteredActivities = responseArr.filter(activity => activity !== null);
       res.status(200).send(filteredActivities);
    } catch (error) {
        res.status(500).send(error); 
    }
})

router.get('/:id/data/:data', async (req, res) => {
    try {
        var id = req.params.id;
        const codiActivitats =  db.collection('users').doc(id);
        const response = await codiActivitats.get();
        var date = req.params.data;
        date = date.slice(0, -4);
        date = date.replace(' ', 'T');
        let responseArr = await Promise.all(response.data().activities.map(async activity => {
            const activityRef = db.collection("actividades").doc(activity)
            const response = await activityRef.get();
            if (response.exists && response.data().data_inici >= date) {
                return response.data();
            }
            else {
                return null;
            }
        }));
        const filteredActivities = responseArr.filter(activity => activity !== null);
       res.status(200).send(filteredActivities);
    } catch (error) {
        res.status(500).send(error); 
    }
})


module.exports = router