const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

const checkUserAndFetchData = require('./middleware').checkUserAndFetchData;

//foro existe?
router.get('/exists', async (req, res) => {
    try {
        
        var activitatCode = req.query.activitat_code;

        const docRef = db.collection('foros').where('activitat_code', '==', activitatCode).limit(1);

        docRef.get()
        .then(snapshot => {
            if (!snapshot.empty) {
                // Si existe al menos un documento con el activitat_code dado, entonces el foro existe
                const data = snapshot.docs[0].data();
                res.status(200).json({ "exists": true, "data": data });
            } else {
                // Si no existe ningún documento el foro no existe
                res.status(200).json({ "exists": false });
            }
        })
        .catch(error => {
            res.status(500).send("Error interno del servidor");
        });
    } catch (error) {
        res.status(500).send("Error interno del servidor");
    }
});

//crear foro
router.post('/create', async(req, res) => {
    try {
        const { activitat_code } = req.body;
 
        const docRef = await db.collection('foros').add({
            'activitat_code': activitat_code,
        });

        res.status(201).send({ message: "Foro creado exitosamente", id: docRef.id });
    }
    catch (error){
        res.status(500).send("Error interno del servidor");
    }
});

//get els posts d'un foro
router.get('/:foroId/posts', async (req, res) => {
    try {
        const foroId = req.params.foroId;
        
        // Obtener los posts del foro con el foroId especificado
        const postsRef = db.collection('foros').doc(foroId).collection('posts');
        const snapshot = await postsRef.get();

        if (snapshot.empty) {
            res.status(404).send('No hay posts encontrados para el foro');
            return;
        }

        let posts = [];
        snapshot.forEach(doc => {
            posts.push(doc.data());
        });

        res.status(200).json(posts);
    } catch (error) {
        res.status(500).send('Error interno del servidor');
    }
});

//publica un post
router.post('/:foroId/posts', checkUserAndFetchData, async (req, res) => {
    try {
        const { mensaje, fecha, numero_likes } = req.body;
        const foroId = req.params.foroId;

        const username = req.userDocument.data().username;

        // Verificar si el foro existe
        const foroRef = db.collection('foros').doc(foroId);
        const foroSnapshot = await foroRef.get();

        if (!foroSnapshot.exists) {
            res.status(404).send("Foro no encontrado");
            return;
        }

        // Agregar el nuevo post al foro
        await foroRef.collection('posts').add({
            username: username,
            mensaje: mensaje,
            fecha: fecha,
            numero_likes: numero_likes
        });

        res.status(201).send("Post agregado exitosamente al foro");
    } catch (error) {
        res.status(500).send("Error interno del servidor");
    }
});

//elimina un post
router.delete('/:foroId/posts/:postId', checkUserAndFetchData, async(req, res) => {
    try {
        const foroId = req.params.foroId;
        const postId = req.params.postId;

        // Verificar si el foro existe
        const foroRef = db.collection('foros').doc(foroId);
        const foroSnapshot = await foroRef.get();

        if (!foroSnapshot.exists) {
            res.status(404).send("Foro no encontrado");
            return;
        }

        const username = req.userDocument.data().username;

        const postSnapshot = await foroRef.collection('posts').doc(postId).get();

        if (!postSnapshot.exists) {
            res.status(404).send("Post no encontrado");
            return;
        }

        const postUsername = postSnapshot.data().username;

        if(username == postUsername) {
            await foroRef.collection('posts').doc(postId).delete();
            res.status(200).send('OK');
        }
        else res.status(301).send('Not creator of the post');
    }
    catch (error) {
        res.send(error);
    }
});

//crea una reply
router.post('/:foroId/posts/:postId/reply', checkUserAndFetchData, async (req, res) => {
    try {
        const { mensaje, fecha, numero_likes } = req.body;
        const foroId = req.params.foroId;
        const postId = req.params.postId;

        const username = req.userDocument.data().username;

        // Verificar si el foro existe
        const foroRef = db.collection('foros').doc(foroId);
        const foroSnapshot = await foroRef.get();

        if (!foroSnapshot.exists) {
            res.status(404).send("Foro no encontrado");
            return;
        }

        // Verificar si el post existe
        const postRef = foroRef.collection('posts').doc(postId);
        const postSnapshot = await postRef.get();

        if (!postSnapshot.exists) {
            res.status(404).send("Post no encontrado");
            return;
        }

        // Agregar el nuevo post al foro
        await postRef.collection('reply').add({
            username: username,
            mensaje: mensaje,
            fecha: fecha,
            numero_likes: numero_likes
        });

        res.status(201).send("Reply agregada exitosamente al foro");
    } catch (error) {
        res.status(500).send("Error interno del servidor");
    }
});

//get replies
router.get('/:foroId/posts/:postId/reply', async (req, res) => {
    try {
        const foroId = req.params.foroId;
        const postId = req.params.postId;
        
        // Obtener los posts del foro con el foroId especificado
        const postsRef = db.collection('foros').doc(foroId).collection('posts').doc(postId).collection('reply');
        const snapshot = await postsRef.get();

        if (snapshot.empty) {
            res.status(404).send('No hay replies encontrados para el post');
            return;
        }

        let posts = [];
        snapshot.forEach(doc => {
            posts.push(doc.data());
        });

        res.status(200).json(posts);
    } catch (error) {
        res.status(500).send('Error interno del servidor');
    }
});

//elimina reply
router.delete('/:foroId/posts/:postId/reply/:replyId', checkUserAndFetchData, async(req, res) => {
    try {
        const foroId = req.params.foroId;
        const postId = req.params.postId;
        const replyId = req.params.replyId;

        // Verificar si el foro existe
        const postRef = db.collection('foros').doc(foroId).collection('posts').doc(postId);
        const postSnapshot = await postRef.get();

        if (!postSnapshot.exists) {
            res.status(404).send('No hay replies encontrados para el post');
            return;
        }

        const username = req.userDocument.data().username;

        const replySnapshot = await postRef.collection('reply').doc(replyId).get();

        if (!replySnapshot.exists) {
            res.status(404).send("Reply no encontrada");
            return;
        }

        const replyUsername = replySnapshot.data().username;

        if(username == replyUsername) {
            await postRef.collection('reply').doc(replyId).delete();
            res.status(200).send('OK');
        }
        else res.status(301).send('Not creator of the post');
    }
    catch (error) {
        res.status(500).send('Error interno del servidor');
    }
});

module.exports = router