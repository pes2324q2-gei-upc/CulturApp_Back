const firebase = require('@firebase/testing');

const projectId = 'culturapp-82c6c'; // Reemplaza esto con el ID de tu proyecto

beforeAll(async () => {
  console.log('Initializing Firestore');
  const app = await firebase.initializeTestApp({ projectId });
  db = app.firestore();
});

afterAll(async () => {
  console.log('Deleting all documents');
  
  const collections = ['reportsUsuaris']; // Agrega aquí todas las colecciones que quieras borrar

  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();

    // Borrar todos los documentos en la colección
    const deletePromises = snapshot.docs.map(doc => db.collection(collection).doc(doc.id).delete());
    await Promise.all(deletePromises);
  }
  console.log('Closing Firestore');
  await Promise.all(firebase.apps().map(app => app.delete()));
});