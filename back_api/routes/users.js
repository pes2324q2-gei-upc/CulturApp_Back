const admin = require('firebase-admin')
const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');
const { checkUserAndFetchData, checkUsername, checkAdmin, checkPerson } = require('./middleware');

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');

function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

router.get('/exists', async (req, res) => {
    try {
        var uid = req.query.uid;
       
        const userRef = db.collection('users').doc(uid);
        const userSnapshot = await userRef.get();
    
        if (userSnapshot.exists) {
            res.status(200).send("exists");
        } else {
            res.status(200).send("notexists");
        }
    } catch (error){
        res.send(error);
    }
});

router.get('/uniqueUsername', checkPerson, async (req, res) => {
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

router.get('/read/users', checkPerson,  async (req, res) => {
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


router.get('/infoToken', async (req, res) => {
    try {
        const id = req.headers.authorization.split(' ')[1];
        const docRef = db.collection('users').doc(id);
        const response = await docRef.get();
        if (response.exists) {
            const respdata = response.data();
            respdata.token = encrypt(response.id).encryptedData;
            res.status(200).send(respdata);
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    } catch (error){
        res.send(error);
    }
});


router.get('/:id', checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const docRef = db.collection('users').doc(id);
        const response = await docRef.get();
        if (response.exists) {
            res.status(200).send(response.data());
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    } catch (error){
        res.send(error);
    }
});



router.post('/create', async(req, res) => {
    try {
        const { uid, username, email, favcategories } = req.body;

        const categories = favcategories;

        const usersCollection = db.collection('users');
        
        const activities = [];

        await usersCollection.doc(uid).set({
          'email': email,
          'username': username,
          'favcategories': categories,
          'activities': activities,
          'id': uid,
        });
        res.status(200).send('OK');
    }
    catch (error){
        res.send(error);
    }
});

/*router.get('/:id', checkPerson, async (req, res) => {
    try {
        var id = req.params.id;
        const docRef = db.collection('users').doc(id);
        const response = await docRef.get();
        if (response.exists) {
            res.status(200).send(response.data());
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    } catch (error){
        res.send(error);
    }
});*/

router.get('/:id/activitats', checkUserAndFetchData, async (req, res) => {
    try {
            let responseArr = await Promise.all(req.userDocument.data().activities.map(async activity => {
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

router.post('/activitats/signout', checkUserAndFetchData, async(req, res) => {
    try {
        const { uid, activityId } = req.body;

        const userRef = db.collection('users').doc(uid);
        const userSnapshot = await req.userDocument;
    
        if (userSnapshot.exists) {
            if (userSnapshot.id == uid) {
                const activities = userSnapshot.data().activities || [];
    
                const index = activities.indexOf(activityId);
                if (index !== -1) activities.splice(index, 1);
                await userRef.update({ activities: activities });

                res.status(200).send("OK");
            }
            else {
                res.status(401).send('Forbidden');
            }
        }
      } catch (error) {
        res.send(error);
    }
});


router.get('/:uid/favcategories', checkUserAndFetchData, async (req, res) => { //MODIFICADA
    try {

        const favCategories = req.userDocument.data().favcategories;
        res.status(200).json(favCategories);
    } catch (error) {
        console.error('Error al obtener las categorías favoritas del usuario:', error);
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/:uid/username', checkUserAndFetchData, async (req, res) => {
    try {
        const uid = req.params.uid;
        const userDoc = await req.userDocument;

        if (userDoc.exists && userDoc.id == uid) {
            const userData = userDoc.data();
            const usname = userData.username;
            res.status(200).json(usname);
        }
        else if (userDoc.exists) {
            return res.status(401).send('Forbidden');
        }
        else {
            return res.status(404).send('Not found');
        }
    } catch (error) {
        console.error('Error al obtener username del usuario:', error);
        res.status(500).send('Error interno del servidor');
    }
});


router.get('/activitats/search/:name', checkUserAndFetchData, async (req, res) => {
    try {
        var name = req.params.name;
        let responseArr = await Promise.all(req.userDocument.data().activities.map(async activity => {
            const activityRef = db.collection("actividades").doc(activity);
            const responseAct = await activityRef.get();

            if(!responseAct.exists) return null;
            else if (responseAct.data().denominaci === name) {
                return responseAct.data();
            } else {
                return null; // If activity doesn't match the name, return null
            }
        }));

        // Filter out null values (activities that don't match the name)
        const filteredResponseArr = responseArr.filter(activity => activity !== null);
        res.status(200).send(filteredResponseArr);
    } catch (error){
        res.send(error);
    }
});

router.get('/categories/:categories', checkUserAndFetchData, async (req, res) => {
    try {
        var categories = req.params.categories.split(",");
        let responseArr = await Promise.all(req.userDocument.data().activities.map(async activity => {
            const activityRef = db.collection("actividades").doc(activity)//.where('tags_categor_es', 'array-contains-any', categories);
            const responseAct = await activityRef.get();
            if(!responseAct.exists) return  null;
            else if(responseAct.data().tags_categor_es.some(r=> categories.includes(r))){
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

router.get('/data/:data', checkUserAndFetchData, async (req, res) => {
    try {
        var date = req.params.data;
        date = date.slice(0, -4);
        date = date.replace(' ', 'T');
        let responseArr = await Promise.all(req.userDocument.data().activities.map(async activity => {
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



router.get('/username', async (req, res) => {
    try {
        var uid = req.query.uid;

        const usersRef = db.collection('users').doc(uid);

        const querySnapshot = await usersRef.get();

        if (!querySnapshot.empty) {
            res.status(200).send(querySnapshot.data().username);
        } else {
            res.status(300).send("Error");
        }
    } catch (error) {
        res.status(500).send(error); 
    }
});

router.post('/edit', checkUserAndFetchData, async(req, res) => { //MODIFICAR PARA USO DE TOKENS
    try {

        const { uid, username, favcategories } = req.body;

        userDoc = await req.userDocument;

        const categories = JSON.parse(favcategories);

        const usersCollection = db.collection('users');
        
        const activities = [];

        if (userDoc.exists && userDoc.id == uid) {
            await usersCollection.doc(uid).update({
                'username': username,
                'favcategories': categories,
              });
      
              res.status(200).send('OK');
        }
        else {
            res.status(401).send('Forbidden');
        }

    }
    catch (error){
        res.send(error);
    }
});
router.get('/activitats/isuserin', checkUserAndFetchData, async (req, res) => {
    try {
        var uid = req.query.id;
        var activityId = req.query.activityId;
        const userSnapshot = await req.userDocument;
    
        if (userSnapshot.exists) {
            if (uid == userSnapshot.id) {
                const activities = userSnapshot.data().activities || [];
                if (activities.includes(activityId)) {
                    res.status(200).send("yes");
                } else {
                    res.status(200).send("no");
                }
            }
            else {
                res.status(401).send("Forbidden");
            }
        } else {
            res.status(404).send("Not Found");
        }
    } catch (error){
        res.send(error);
    }
});

router.post('/activitats/signup', checkUserAndFetchData, async(req, res) => {
    try {
        const { uid, activityId } = req.body;
        const userRef = db.collection('users').doc(uid);
        const userSnapshot = await userRef.get();
    
        if (userSnapshot.exists) {
            if (userSnapshot.id == uid) {
                const activities = userSnapshot.data().activities || [];
                if (!activities.includes(activityId)) {
                    activities.push(activityId);
                    await userRef.update({ activities: activities });
                }
                res.status(200).send("OK");
            }
            else {
                res.status(401).send("Forbidden");
            }
          
        } else {
            res.status(404).send("El usuario no existe");
        }
      } catch (error) {
        res.send(error);
    }
});

module.exports = router