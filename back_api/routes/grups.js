const express = require('express')
const router = express.Router()

const { v4: uuidv4 } = require("uuid");
const multer=require('multer')
const upload=multer({storage: multer.memoryStorage()})

router.use(express.json());

const { db, bucket } = require('../firebaseConfig');

const checkUserAndFetchData = require('./middleware').checkUserAndFetchData;
const checkUsername = require('./middleware').checkUsername;

//funcio per afegir imatges al bucket
async function createImage(file){
    const uuid = uuidv4();
    const name = uuid + '_' + file.originalname;
    const fileName = 'grups/' + name;
    await bucket.file(fileName).createWriteStream().end(file.buffer);
    return fileName;
}

//crear grup
router.post('/create', checkUserAndFetchData, upload.single('file'), async(req, res) => {
    try {

        const { name, descr, members } = req.body;


        for (const member of members) {
            if (!(await checkUsername(member, res, 'Usuario que se intenta añadir al grupo no encontrado'))) return;
        }

        const username = req.userDocument.data().username;

        //me añado a mi mismo como un participante
        members.push(username);
        
        filename = '';

        if (req.file !== undefined) {
            filename = await createImage(req.file);
        }

        const docRef = await db.collection('grups').add({
            'id': " ",
            'nom': name,
            'descripcio': descr,
            'imatge': filename,
            'participants': members,
            'last_msg': ' ',
            'last_time': ' '
        });

        res.status(201).send({ message: "Grup creado exitosamente", id: docRef.id });

        await docRef.update({
            id: docRef.id
        });
        
    }
    catch (error){
        res.status(500).send("Error interno del servidor");
    }
});

//get grup info 
router.get('/:grupId', async (req, res) => {
    try {
        const grupId = req.params.grupId;

        const mensajesRef = db.collection('grups').doc(grupId);
        const doc = await mensajesRef.get();

        //verifica que el document existeix
        if (!doc.exists) {
            return res.status(404).json({ error: 'Grup not found' });
        }

        const infoGrup = doc.data();
        return res.status(200).json(infoGrup);

    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});


//get dels grups on es troba l'usuari
router.get('/users/all', checkUserAndFetchData, async (req, res) => {
    try {

        const username = req.userDocument.data().username;

        const querySnapshot = await db.collection('grups').where('participants', 'array-contains', username).get();

        const userGroups = [];
    
        querySnapshot.forEach(doc => {
            const groupData = doc.data();
            userGroups.push(groupData);
        });
    
        return res.status(200).json(userGroups);
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

//update info del grup
router.put('/:grupId/update', upload.single('file'), async (req, res) => {
    try {
        const grupId = req.params.grupId;
        const { name, descr, imatge, members } = req.body;

        for (const member of members) {
            if (!(await checkUsername(member, res, 'Usuario que se intenta añadir al grupo no encontrado'))) return;
        }

        filename = imatge;

        if (req.file !== undefined) {
            filename = await createImage(req.file);
        }

        await db.collection('grups').doc(grupId).update({
            'nom': name,
            'descripcio': descr,
            'imatge': filename,
            'participants': members
        });

        res.status(200).send({ message: "Grupo actualizado exitosamente" });

    } catch (error) {
        res.status(500).send("Error interno del servidor");
    }
});

//post de mensajes 
router.post('/:grupId/mensajes', checkUserAndFetchData, async (req, res) => {
    try {
        const { mensaje, fecha } = req.body;
        const grupId = req.params.grupId;

        const username = req.userDocument.data().username;

        // Verificar si el xat existe
        const grupRef = db.collection('grups').doc(grupId);
        const grupSnapshot = await grupRef.get();

        if (!grupSnapshot.exists) {
            res.status(404).send("Grup no encontrado");
            return;
        }

        // Agregar el nuevo mensaje al grup
        await grupRef.collection('mensajes').add({
            senderId: username,
            mensaje: mensaje,
            fecha: fecha
        });

        // Actualitzar l'ultim missatge i data al grup
        await grupRef.update({
            last_msg: mensaje,
            last_time: fecha
        });

        res.status(201).send("Mensaje agregado exitosamente al grup");
    } catch (error) {
        res.status(500).send("Error interno del servidor");
    }
});


//get mensajes
router.get('/:grupId/mensajes', async (req, res) => {
    try {
        const grupId = req.params.grupId;
        
        //Obtener los mensajes del xat con el grupId especificado
        const mensajesRef = db.collection('grups').doc(grupId).collection('mensajes');
        const snapshot = await mensajesRef.get();

        if (snapshot.empty) {
            res.status(404).send('No hay mensajes encontrados para el grupo');
            return;
        }

        let mensajes = [];
        snapshot.forEach(doc => {
            mensajes.push(doc.data());
        });

        res.status(200).json(mensajes);
    } catch (error) {
        res.status(500).send('Error interno del servidor');
    }
});

module.exports = router