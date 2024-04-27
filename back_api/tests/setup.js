const firebase = require('@firebase/testing');
require('dotenv').config();

beforeAll(async () => {
  db  = require('../firebaseConfig').db;
});

afterEach(async () => {
  
  const collections = ['reportsUsuaris', 'reportsBugs']; // Agregar aquí todas las colecciones que se quieran borrar
  
  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();

    if(snapshot.empty) continue;    

    // Borrar todos los documentos en la colección
    const deletePromises = snapshot.docs.map(doc => db.collection(collection).doc(doc.id).delete());
    await Promise.all(deletePromises);
  }
  
});

afterAll(async () => {
  await Promise.all(firebase.apps().map(app => app.delete())); //Cierra todas las app de FireStore
});

