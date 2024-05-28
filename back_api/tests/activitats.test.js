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

  /*  it('debería enviar 401 porque el token no es válido', async () => {
    
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

    });*/
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
  const act = {
    denominaci: "testNom1",
    descripcio: "testDescripcio1",
    data_inici: "2024-02-02T00:00:00.000",
    data_fi: "testDataFi1",
    tags_categor_es: ["testTag1", "testTag2"],
    ubicacio: "testUbicacio1",
    aforament: 100,
    aforament_actual: 50,
    assistents: ["testUid1"],
    assistents_actuals: 1
  }
  beforeEach(async () => {
      for (const usuari of testUsers) {
          await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
      } 
      
      for (const client of testClients) {
          await db.collection('clients').doc(client.uid).set({"username": client.username});
      } 
      
      await db.collection('actividades').doc('testAct1').set({
          'denominaci': act.denominaci,
          'descripcio': act.descripcio,
          'data_inici': act.data_inici,
          'data_fi': act.data_fi,
          'tags_categor_es': act.tags_categor_es,
          'ubicacio': act.ubicacio,
          'aforament': act.aforament,
          'aforament_actual': act.aforament_actual,
          'assistents': act.assistents,
          'assistents_actuals': act.assistents_actuals
      });
  });

    it('debería obtener la actividad porque lo pide un usuario', async () => {

        const response = await request(app)
        .get('/activitats/read/testAct1')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(act);
    });
    
    it('debería obtener la actividad porque lo pide un cliente', async () => {

        const response = await request(app)
        .get('/activitats/read/testAct1')
        .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(act);
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
describe('GET /activitats/mediambient', () => {
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
  const act = [{
    denominaci: "testNom1",
    descripcio: "testDescripcio1",
    data_inici: "2026-12-02T00:00:00.000",
    data_fi: "testDataFi1",
    tags_categor_es: ["Residus", "testTag2"],
    ubicacio: "testUbicacio1",
    aforament: 100,
    aforament_actual: 50,
    assistents: ["testUid1"],
    assistents_actuals: 1
  }]
  beforeEach(async () => {
    for (const usuari of testUsers) {
        await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
    } 
    
    for (const client of testClients) {
        await db.collection('clients').doc(client.uid).set({"username": client.username});
    } 
    
    await db.collection('actividades').doc('testAct1').set(act[0]);
  });
  it('debería obtener todas las actividades de mediambient', async () => {

      const response = await request(app)
      .get('/activitats/mediambient')
      .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(act);
  });
  it('debería enviar 401 porque el token no es válido', async () => {
      
          const response = await request(app)
          .get('/activitats/mediambient')
          .set('Authorization', `Bearer testUid1`);
          expect(response.statusCode).toBe(401);
          expect(response.text).toBe('Token inválido');
    });
    it('debería enviar 404 porque el usuario o cliente no existe', async () => {
                
            const response = await request(app)
                .get('/activitats/mediambient')
                .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`);
            expect(response.statusCode).toBe(404);
            expect(response.text).toBe('Usuario o cliente que envió la solicitud no encontrado');
    });
  });
describe('POST /activitats/toVencidas', () => {
    const actsTest = [ 
      act1 = {
      denominaci: "testNom1",
      descripcio: "testDescripcio1",
      data_inici: "2024-02-02T00:00:00.000",
      data_fi: "2024-02-02T00:00:00.000",
      tags_categor_es: ["testTag1", "testTag2"],
      ubicacio: "testUbicacio1",
      aforament: 100,
      aforament_actual: 50,
      assistents: ["testUid1"],
      assistents_actuals: 1
    },
    act2 = {
      denominaci: "testNom1",
      descripcio: "testDescripcio1",
      data_inici: "2024-02-02T00:00:00.000",
      data_fi: "2024-07-07T00:00:00.000",
      tags_categor_es: ["testTag1", "testTag2"],
      ubicacio: "testUbicacio1",
      aforament: 100,
      aforament_actual: 50,
      assistents: ["testUid1"],
      assistents_actuals: 1
    },
    act3 = {
      denominaci: "testNom1",
      descripcio: "testDescripcio1",
      data_inici: "2024-07-07T00:00:00.000",
      data_fi: "2024-07-07T00:00:00.000",
      tags_categor_es: ["testTag1", "testTag2"],
      ubicacio: "testUbicacio1",
      aforament: 100,
      aforament_actual: 50,
      assistents: ["testUid1"],
      assistents_actuals: 1
    }
  ]
  const testClients = [ 
    {
    uid: 'testUid2',
    username: 'testUsername2',
    },
];
  beforeEach(async () => {
    for (const act of actsTest) {
      await db.collection('actividades').doc().set(act);
    } 
    for (const client of testClients) {
      await db.collection('clients').doc(client.uid).set({"username": client.username});
    }
  });
  it('debería enviar 200 porque se han actualizado las actividades', async () => {
      const response = await request(app)
      .post('/activitats/toVencidas')
      .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`);
      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('Actividades pasadas a vencidas');
      const vencidas = await db.collection('vencidas').get();
      expect(vencidas.docs[0].data()).toEqual(act1);
  });
  it('debería enviar 401 porque el token no es válido', async () => {
      
          const response = await request(app)
          .post('/activitats/toVencidas')
          .set('Authorization', `Bearer testUid1`);
          expect(response.statusCode).toBe(401);
          expect(response.text).toBe('Token inválido');
    });
    it('debería enviar 404 porque el usuario o cliente no existe', async () => {
                
            const response = await request(app)
                .post('/activitats/toVencidas')
                .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`);
            expect(response.statusCode).toBe(404);
            expect(response.text).toBe('Usuario o cliente que envió la solicitud no encontrado');
    });
});

describe('GET /activitats/reward/:id', () => {

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
  const act = {
    denominaci: "testNom1",
    descripcio: "testDescripcio1",
    data_inici: "2024-02-02T00:00:00.000",
    data_fi: "testDataFi1",
    tags_categor_es: ["testTag1", "testTag2"],
    ubicacio: "testUbicacio1",
    aforament: 100,
    aforament_actual: 50,
    assistents: ["testUid1"],
    assistents_actuals: 1,
    reward: "cubata"
  }
  const act2 = {
    denominaci: "testNom2",
    descripcio: "testDescripcio2",
    data_inici: "2024-02-02T00:00:00.000",
    data_fi: "testDataFi1",
    tags_categor_es: ["testTag1", "testTag2"],
    ubicacio: "testUbicacio1",
    aforament: 100,
    aforament_actual: 50,
    assistents: ["testUid1"],
    assistents_actuals: 1
  }

  beforeEach(async () => {
      for (const usuari of testUsers) {
          await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
      } 
      
      for (const client of testClients) {
          await db.collection('clients').doc(client.uid).set({"username": client.username});
      } 
      
      
      await db.collection('actividades').doc('testAct1').set({
          'id': 'testAct1',
          'denominaci': act.denominaci,
          'descripcio': act.descripcio,
          'data_inici': act.data_inici,
          'data_fi': act.data_fi,
          'tags_categor_es': act.tags_categor_es,
          'ubicacio': act.ubicacio,
          'aforament': act.aforament,
          'aforament_actual': act.aforament_actual,
          'assistents': act.assistents,
          'assistents_actuals': act.assistents_actuals,
          'reward': act.reward
      });

      await db.collection('actividades').doc('testAct2').set({
        'id': 'testAct1',
        'denominaci': act2.denominaci,
        'descripcio': act2.descripcio,
        'data_inici': act2.data_inici,
        'data_fi': act2.data_fi,
        'tags_categor_es': act2.tags_categor_es,
        'ubicacio': act2.ubicacio,
        'aforament': act2.aforament,
        'aforament_actual': act2.aforament_actual,
        'assistents': act2.assistents,
        'assistents_actuals': act2.assistents_actuals
    });
      
  });

  it('debería obtener 404', async () => {

      const response = await request(app)
      .get('/activitats/reward/testAct3')
      .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

      expect(response.statusCode).toBe(404);
  });

  it('debería obtener cubata', async () => {

    const response = await request(app)
    .get('/activitats/reward/testAct1')
    .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(response.statusCode).toBe(200);
    expect(response.text).toEqual("cubata");
});

it('debería obtener null', async () => {

  const response = await request(app)
  .get('/activitats/reward/testAct2')
  .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

  expect(response.statusCode).toBe(200);
  expect(response.text).toEqual("null");
});
    
});

describe('POST /activitats/reward/:id', () => {
  const testUsers = [
    { uid: 'testUid1', username: 'testUsername1' },
    { uid: 'testUid2', username: 'testUsername2' },
  ];

  const testClients = [
    { uid: 'testUid3', username: 'testUsername3' },
  ];

  const act = {
    id: 'testAct1',
    denominaci: "testNom1",
    descripcio: "testDescripcio1",
    data_inici: "2024-02-02T00:00:00.000",
    data_fi: "testDataFi1",
    tags_categor_es: ["testTag1", "testTag2"],
    ubicacio: "testUbicacio1",
    aforament: 100,
    aforament_actual: 50,
    assistents: ["testUid1"],
    assistents_actuals: 1,
    reward: "cubata"
  };

  const organitzadors = [
    { user: 'testUid1', activitat: 'testAct1' },
  ];

  beforeEach(async () => {
    for (const usuari of testUsers) {
      await db.collection('users').doc(usuari.uid).set({ "username": usuari.username });
    }

    for (const client of testClients) {
      await db.collection('clients').doc(client.uid).set({ "username": client.username });
    }

    for (let i = 0; i < organitzadors.length; i++) {
      await db.collection('organitzadors').doc(`user${i}`).set(organitzadors[i]);
    }

    await db.collection('actividades').doc('testAct1').set(act);
  });

  it('debería actualizar la recompensa correctamente', async () => {
    const newReward = 'cerveza';
    const response = await request(app)
      .post('/activitats/reward/testAct1')
      .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)
      .send({ reward: newReward });

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('OK');

    const updatedDoc = await db.collection('actividades').doc('testAct1').get();
    expect(updatedDoc.data().reward).toBe(newReward);
  });

  it('debería devolver 404 si la actividad no se encuentra', async () => {
    const response = await request(app)
      .post('/activitats/reward/nonExistentAct')
      .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)
      .send({ reward: 'cerveza' });

    expect(response.statusCode).toBe(404);
    expect(response.text).toBe('Actividad no encontrada');
  });

  it('debería no permitir actualizar la recompensa', async () => {
    const newReward = 'cerveza';
    const response = await request(app)
      .post('/activitats/reward/testAct1')
      .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`)
      .send({ reward: newReward });

    expect(response.statusCode).toBe(401);
    expect(response.text).toBe('Unauthorized');
  });
});

