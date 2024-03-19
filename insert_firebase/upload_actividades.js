const admin = require('firebase-admin');
const serviceAccount = require("./key_service_account.json");
const data = require("./actividades.json");
const collectionKey = "actividades";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();
const settings = { timestampsInSnapshots: true };
firestore.settings(settings);

if (data && Array.isArray(data)) {
    data.forEach(doc => {
        // Separar las imágenes por comas
        const imagenes = doc.imatges.split(',');
        // Obtener solo la primera imagen
        const primeraImagen = imagenes[0].trim(); // eliminar espacios en blanco al principio y al final

        const newData = {
            codi: doc.codi,
            denominaci: doc.denominaci ?? "No disponible",
            latitud: parseFloat(doc.latitud) || 1.0,
            longitud: parseFloat(doc.longitud) || 1.0,
            data_inici: doc.data_inici ?? "No disponible",
            data_fi: doc.data_fi ?? "No disponible",
            horari: doc.horari ?? "No disponible",
            comarca: doc.comarca ?? "No disponible",
            descripcio: doc.descripcio ?? "No disponible",
            tags_categor_es: doc.tags_categor_es ? doc.tags_categor_es.split(',').map(tag => tag.substring(tag.indexOf('/') + 1)) : ["No disponible"],
            imatges: ("https://agenda.cultura.gencat.cat" + primeraImagen) ?? "No disponible",
            entrades: doc.entrades ?? "No disponible",
            adre_a: doc.adre_a ?? "No disponible",
            enlla_os: doc.enlla_os ?? "No disponible",
            visualitzacions: 0
        };

        const twoNextYear = new Date();

        // Add one year to the current date
        twoNextYear.setFullYear(twoNextYear.getFullYear() + 2)

        if(newData.data_inici != "No disponible" && newData.data_inici != "9999-09-09T00:00:00.000" && twoNextYear.toISOString().replace('Z', '') > newData.data_inici && newData.data_inici >= new Date().toISOString().replace('Z', '')) {
            firestore.collection(collectionKey).doc(doc.codi).set(newData).then((res) => {
                console.log("Document " + doc.codi + " successfully written!");
            }).catch((error) => {
                console.error("Error writing document: ", error);
            });
        }
    });
}
