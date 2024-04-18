const express = require('express')
const router = express.Router()

router.use(express.json());

const { db } = require('../firebaseConfig');

//foro existe?
router.get('/exists', async (req, res) => {
    try {
        console.log("Solicitud recibida en la ruta '/foros/exists'");
        
        var activitatCode = req.query.activitat_code;
        console.log("Valor de activitat_code:", activitatCode);

        const docRef = db.collection('foros').where('activitat_code', '==', activitatCode).limit(1);

        docRef.get()
        .then(snapshot => {
            if (!snapshot.empty) {
                // Si existe al menos un documento con el activitat_code dado, entonces el foro existe
                const data = snapshot.docs[0].data();
                res.status(200).json({ "exists": true, "data": data });
            } else {
                // Si no existe ningún documento con el activitat_code dado, el foro no existe
                res.status(200).json({ "exists": false });
            }
        })
        .catch(error => {
            console.error("Error al consultar la base de datos:", error);
            res.status(500).send("Error interno del servidor");
        });
    } catch (error) {
        console.error("Error en la ruta '/foros/exists':", error.message);
        res.status(500).send("Error interno del servidor");
    }
});

//crear foro
router.post('/create', async(req, res) => {
    try {
        console.log("Solicitud recibida en la ruta '/foros/create'");

        const { activitat_code} = req.body;

        //const posts = [];
 
        const docRef = await db.collection('foros').add({
            'activitat_code': activitat_code,
            //'posts': posts
        });

        res.status(201).send({ message: "Foro creado exitosamente", id: docRef.id });
    }
    catch (error){
        console.error("Error al crear el foro:", error);
        res.status(500).send("Error interno del servidor");
    }
});

router.get('/:foroId/posts', async (req, res) => {
    try {
        const foroId = req.params.foroId;
        
        // Obtener los posts del foro con el foroId especificado
        const postsRef = db.collection('foros').doc(foroId).collection('posts');
        const snapshot = await postsRef.get();

        if (snapshot.empty) {
            console.log('No hay posts encontrados para el foro con el ID:', foroId);
            res.status(404).send('No hay posts encontrados para el foro');
            return;
        }

        let posts = [];
        snapshot.forEach(doc => {
            posts.push(doc.data());
        });

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error al obtener los posts del foro:', error);
        res.status(500).send('Error interno del servidor');
    }
});

//publica un post
// Ruta para agregar un nuevo post a un foro existente
router.post('/:foroId/posts', async (req, res) => {
    console.log("intenta crear un post")
    try {
        const { username, mensaje, fecha, numero_likes } = req.body;
        const foroId = req.params.foroId;

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
        console.error("Error al agregar post al foro:", error);
        res.status(500).send("Error interno del servidor");
    }
});

//edita un post
router.put('/:foroId/posts/:postId', async(req, res) => {

});

//elimina un post
router.delete('/:foroId/posts/:postId', async(req, res) => {
});

//crea una reply
router.post('/:foroId/posts/:postId/reply', async (req, res) => {
    console.log("intenta crear un post")
    try {
        const { username, mensaje, fecha, numero_likes } = req.body;
        const foroId = req.params.foroId;
        const postId = req.params.postId;

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
        console.error("Error al agregar reply al post:", error);
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
            console.log('No hay replies encontrados para el post con el ID:', postId);
            res.status(404).send('No hay replies encontrados para el post');
            return;
        }

        let posts = [];
        snapshot.forEach(doc => {
            posts.push(doc.data());
        });

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error al obtener las replies del foro:', error);
        res.status(500).send('Error interno del servidor');
    }
});

module.exports = router