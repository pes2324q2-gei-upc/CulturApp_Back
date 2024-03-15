const express = require('express');
const app = express();
const axios = require('axios');

const admin = require("firebase-admin");
const credentials = require("./key.json");

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

app.use(express.json());

app.use(express.urlencoded({extended: true}));

const db = admin.firestore();

const PORT = process.env.PORT || 8080;

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
        const activityRef = db.collection("actividades").limit(20);
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
        // Realizar la solicitud GET a la API utilizando axios
        const response = await axios.get('https://analisi.transparenciacatalunya.cat/resource/rhpv-yr4f.json');

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

app.get('/activitats/infantil', async (req, res) => {
    try {
        const activityRef = db.collection("actividades").where('tags_categor_es', 'array-contains-any', ['infantil']);
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

app.listen(PORT, () => {
    console.log(`Server is working on PORT ${PORT}`);
});