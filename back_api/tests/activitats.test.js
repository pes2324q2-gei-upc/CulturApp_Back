const request = require('supertest');
const app = require('../app'); 

const crypto = require('crypto');
const e = require('express');
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');

function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

describe('GET /activitats/read/all', () => {
    const testUsers = [
        {
          uid: 'testUid1',
          username: 'testUsername1',
        },
    ];

    const testClients = [ 
        {
         uid: 'testUid2',
         username: 'testUsername2',
        },
    ];

    beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
        } 
        
        for (const client of testClients) {
            await db.collection('clients').doc(client.uid).set({"username": client.username});
        } 

        await db.collection('actividades').doc('testAct1').set({
            "denominaci": "testNom1",
            "descripcio": "testDescripcio1",
            "data_inici": "testDataInici1",
            "data_fi": "testDataFi1",
            "tags_categor_es": ["testTag1", "testTag2"],
            "ubicacio": "testUbicacio1",
            "aforament": 100,
            "aforament_actual": 50,
            "assistents": ["testUid1"],
            "assistents_actuals": 1
        });
    });

    it('debería obtener todas las actividades porque lo pide un usuario', async () => {

        const response = await request(app)
        .get('/activitats/read/all')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                denominaci: "testNom1"
              })
            ])
          );
    });

    it('debería obtener todas las actividades porque lo pide un cliente', async () => {

        const response = await request(app)
        .get('/activitats/read/all')
        .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                denominaci: "testNom1"
              })
            ])
          );
    });

    it('debería enviar 401 porque el token no es válido', async () => {
    
            const response = await request(app)
            .get('/activitats/read/all')
            .set('Authorization', `Bearer testUid1`);

            expect(response.statusCode).toBe(401);
            expect(response.text).toBe('Token inválido');

    });


    it('debería enviar 404 porque el usuario o cliente no existe', async () => {

        const response = await request(app)
        .get('/activitats/read/all')
        .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`);

        expect(response.statusCode).toBe(404);
        expect(response.text).toBe('Usuario o cliente que envió la solicitud no encontrado');

    });
});


describe('GET /activitats/categoria/:categoria', () => {
    const testUsers = [
        {
          uid: 'testUid1',
          username: 'testUsername1',
        },
    ];

    const testClients = [ 
        {
         uid: 'testUid2',
         username: 'testUsername2',
        },
    ];

    beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
        } 
        
        for (const client of testClients) {
            await db.collection('clients').doc(client.uid).set({"username": client.username});
        } 

        await db.collection('actividades').doc('testAct1').set({
            "denominaci": "testNom1",
            "descripcio": "testDescripcio1",
            "data_inici": "testDataInici1",
            "data_fi": "testDataFi1",
            "tags_categor_es": ["testTag1", "testTag2"],
            "ubicacio": "testUbicacio1",
            "aforament": 100,
            "aforament_actual": 50,
            "assistents": ["testUid1"],
            "assistents_actuals": 1
        });

    });

    it('debería obtener todas las actividades de la categoria porque lo pide un usuario', async () => {

        const response = await request(app)
        .get('/activitats/categoria/testTag1')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                denominaci: "testNom1"
              })
            ])
          );
    });

    it('debería obtener todas las actividades de la categoria porque lo pide un cliente', async () => {

        const response = await request(app)
        .get('/activitats/categoria/testTag2')
        .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                denominaci: "testNom1"
              })
            ])
          );
    });

    it('debería enviar 401 porque el token no es válido', async () => {
    
            const response = await request(app)
            .get('/activitats/categoria/testTag1')
            .set('Authorization', `Bearer testUid1`);

            expect(response.statusCode).toBe(401);
            expect(response.text).toBe('Token inválido');

    });

    it('debería enviar 404 porque el usuario o cliente no existe', async () => {
            
            const response = await request(app)
            .get('/activitats/categoria/testTag1')
            .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`);
    
            expect(response.statusCode).toBe(404);
            expect(response.text).toBe('Usuario o cliente que envió la solicitud no encontrado');
    });
});


describe('GET /activitats/date/:date', () => {
    const testUsers = [
        {
          uid: 'testUid1',
          username: 'testUsername1',
        },
    ];

    const testClients = [ 
        {
         uid: 'testUid2',
         username: 'testUsername2',
        },
    ];

    beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
        } 
        
        for (const client of testClients) {
            await db.collection('clients').doc(client.uid).set({"username": client.username});
        } 

        await db.collection('actividades').doc('testAct1').set({
            "denominaci": "testNom1",
            "descripcio": "testDescripcio1",
            "data_inici": "2024-02-02T00:00:00.000",
            "data_fi": "testDataFi1",
            "tags_categor_es": ["testTag1", "testTag2"],
            "ubicacio": "testUbicacio1",
            "aforament": 100,
            "aforament_actual": 50,
            "assistents": ["testUid1"],
            "assistents_actuals": 1
        });
    });

    it('debería obtener todas las actividades de la fecha porque lo pide un usuario', async () => {

        const response = await request(app)
        .get('/activitats/date/2024-01-01T00:00:00.000')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                denominaci: "testNom1"
              })
            ])
          );
    }); 

    it('debería obtener todas las actividades de la fecha porque lo pide un cliente', async () => {

        const response = await request(app)
        .get('/activitats/date/2024-01-01T00:00:00.000')
        .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                denominaci: "testNom1"
              })
            ])
          );
    });

    it('debería obtener vacío porque no hay actividades en esa fecha', async () => {

        const response = await request(app)
        .get('/activitats/date/2025-03-03T00:00:00.000')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([]);

    });

    it('debería enviar 401 porque el token no es válido', async () => {
    
            const response = await request(app)
            .get('/activitats/date/2024-01-01T00:00:00.000')
            .set('Authorization', `Bearer testUid1`);

            expect(response.statusCode).toBe(401);
            expect(response.text).toBe('Token inválido');

    });

    it('debería enviar 404 porque el usuario o cliente no existe', async () => {
            
            const response = await request(app)
            .get('/activitats/date/2024-01-01T00:00:00.000')
            .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`);
    
            expect(response.statusCode).toBe(404);
            expect(response.text).toBe('Usuario o cliente que envió la solicitud no encontrado');
    });

});


describe('GET /activitats/name/:name', () => {

    const testUsers = [
        {
          uid: 'testUid1',
          username: 'testUsername1',
        },
    ];

    const testClients = [ 
        {
         uid: 'testUid2',
         username: 'testUsername2',
        },
    ];

    beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
        } 
        
        for (const client of testClients) {
            await db.collection('clients').doc(client.uid).set({"username": client.username});
        } 

        await db.collection('actividades').doc('testAct1').set({
            "denominaci": "testNom1",
            "descripcio": "testDescripcio1",
            "data_inici": "2024-02-02T00:00:00.000",
            "data_fi": "testDataFi1",
            "tags_categor_es": ["testTag1", "testTag2"],
            "ubicacio": "testUbicacio1",
            "aforament": 100,
            "aforament_actual": 50,
            "assistents": ["testUid1"],
            "assistents_actuals": 1
        });
    });

    it('debería obtener la actividad porque lo pide un usuario', async () => {

        const response = await request(app)
        .get('/activitats/name/testNom1')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                denominaci: "testNom1"
              })
            ])
          );
    });

    it('debería obtener la actividad porque lo pide un cliente', async () => {

        const response = await request(app)
        .get('/activitats/name/testNom1')
        .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                denominaci: "testNom1"
              })
            ])
          );
    });

    it('debería enviar 404 porque la actividad no existe', async () => {

        const response = await request(app)
        .get('/activitats/name/testNom2')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

        expect(response.statusCode).toBe(404);
        expect(response.text).toBe('Actividad no encontrada');

    });

    it('debería enviar 401 porque el token no es válido', async () => {
    
            const response = await request(app)
            .get('/activitats/name/testNom1')
            .set('Authorization', `Bearer testUid1`);

            expect(response.statusCode).toBe(401);
            expect(response.text).toBe('Token inválido');

    });

    it('debería enviar 404 porque el usuario o cliente no existe', async () => {
            
            const response = await request(app)
            .get('/activitats/name/testNom1')
            .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`);
    
            expect(response.statusCode).toBe(404);
            expect(response.text).toBe('Usuario o cliente que envió la solicitud no encontrado');
    })
    
});

describe('GET /activitats/read/:id', () => {
    const testUsers = [
        {
          uid: 'testUid1',
          username: 'testUsername1',
        },
    ];

    const testClients = [ 
        {
         uid: 'testUid2',
         username: 'testUsername2',
        },
    ];

    beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
        } 
        
        for (const client of testClients) {
            await db.collection('clients').doc(client.uid).set({"username": client.username});
        } 

        await db.collection('actividades').doc('testAct1').set({
            "denominaci": "testNom1",
            "descripcio": "testDescripcio1",
            "data_inici": "2024-02-02T00:00:00.000",
            "data_fi": "testDataFi1",
            "tags_categor_es": ["testTag1", "testTag2"],
            "ubicacio": "testUbicacio1",
            "aforament": 100,
            "aforament_actual": 50,
            "assistents": ["testUid1"],
            "assistents_actuals": 1
        });
    });

    it('debería obtener la actividad porque lo pide un usuario', async () => {

        const response = await request(app)
        .get('/activitats/read/testAct1')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                denominaci: "testNom1"
              })
            ])
          );
    });

    it('debería obtener la actividad porque lo pide un cliente', async () => {

        const response = await request(app)
        .get('/activitats/read/testAct1')
        .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                denominaci: "testNom1"
              })
            ])
          );
    });

    it('debería enviar 401 porque el token no es válido', async () => {
    
        const response = await request(app)
        .get('/activitats/read/testAct1')
        .set('Authorization', `Bearer testUid1`);

        expect(response.statusCode).toBe(401);
        expect(response.text).toBe('Token inválido');

});

    it('debería enviar 404 porque la actividad no existe', async () => {

        const response = await request(app)
        .get('/activitats/read/testAct2')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

        expect(response.statusCode).toBe(404);
        expect(response.text).toBe('Actividad no encontrada');

    });

    it('debería enviar 404 porque el usuario o cliente no existe', async () => {
            
            const response = await request(app)
            .get('/activitats/read/testAct1')
            .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`);
    
            expect(response.statusCode).toBe(404);
            expect(response.text).toBe('Usuario o cliente que envió la solicitud no encontrado');
    });

});
