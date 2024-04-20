const firebase = require('@firebase/testing');
require('dotenv').config();

const projectId = `${process.env.PROJECT_ID}`;

beforeAll(async () => {
  console.log('Initializing Firestore');
  const app = await firebase.initializeTestApp({ projectId });
  db = app.firestore();
});

afterEach(async () => {
  console.log('Deleting all documents');
  
  const collections = ['reportsUsuaris']; // Agregar aquí todas las colecciones que se quieran borrar

  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();

    if(snapshot.empty) continue;    

    // Borrar todos los documentos en la colección
    const deletePromises = snapshot.docs.map(doc => db.collection(collection).doc(doc.id).delete());
    await Promise.all(deletePromises);
  }
});

afterAll(async () => {
  console.log('Closing Firestore');
  await Promise.all(firebase.apps().map(app => app.delete()));
});

