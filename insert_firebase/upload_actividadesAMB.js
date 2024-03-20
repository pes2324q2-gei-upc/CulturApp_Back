const admin = require('firebase-admin');
const serviceAccount = require("./key_service_account.json");
const data = require("./actividadesAMB.json");
const collectionKey = "actividades";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();
const settings = { timestampsInSnapshots: true };
firestore.settings(settings);

if (data && Array.isArray(data.items)) {
    data.items.forEach(doc => {
        let adre_a = "No disponible";
        if (doc.on && doc.on.length > 0 && doc.on[0].carrer) {
            adre_a = doc.on[0].carrer;
        }

        // Verificar si la propiedad 'localitzacio' existe en el objeto
        if (doc.on && doc.on.length > 0 && doc.on[0].localitzacio) {
            const ubicacion = doc.on[0].localitzacio[0];
            // Verificar si las coordenadas están presentes y son diferentes de cero
            if (ubicacion && ubicacion.length === 2 && (ubicacion[0] !== 0 && ubicacion[1] !== 0)) {
                const latitud = ubicacion[1];
                const longitud = ubicacion[0];

                const newData = {
                    codi: doc._id,
                    denominaci: doc.titol || "No disponible",
                    latitud: latitud,
                    longitud: longitud,
                    data_inici: doc.data_sort && doc.data_sort[0] ? doc.data_sort[0] : "No disponible",
                    data_fi: "No disponible",
                    horari: doc.data_sort && doc.data_sort[1] ? doc.data_sort[1] : "No disponible",
                    comarca: "No disponible",
                    descripcio: doc.descripcio || "No disponible",
                    tags_categor_es: Array.isArray(doc.subambit) ? doc.subambit : [doc.subambit || "No disponible"],
                    imatges: doc.imatge_principal.imatge_principal_fitxer || "No disponible",
                    entrades: "No disponible",
                    adre_a: adre_a,
                    enlla_os: doc.detail_url || "No disponible",
                    visualitzacions: 0
                };

                // Verificar si el documento ya existe en la colección antes de agregarlo
                firestore.collection(collectionKey).doc(doc._id).get().then((existingDoc) => {
                    if (!existingDoc.exists && newData.data_inici >= new Date().toISOString().replace('Z', '') && newData.data_inici != "No disponible") {
                        firestore.collection(collectionKey).doc(doc._id).set(newData).then(() => {
                            console.log("Documento " + doc._id + " escrito correctamente!");
                        }).catch((error) => {
                            console.error("Error al escribir el documento: ", error);
                        });
                    }
                }).catch((error) => {
                    console.error("Error al comprobar la existencia del documento: ", error);
                });
            }
        }
    });
}