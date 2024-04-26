const request = require('supertest');
const app = require('../app'); 

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');

function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

describe('POST /amics/create/', () => {
    const testUsers = [
        {
          uid: 'testUid1',
          username: 'testUsername1',
        },
        {
          uid: 'testUid2',
          username: 'testUsername2',
        },
      ];

      beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('usuaris').doc(usuari.uid).set({"username": usuari.username});
          }    
        });

      it('debería enviar 400 porque faltan atributos', async () => {
  
        const res = await request(app)
        .post('/amics/create/')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)
  
        expect(res.statusCode).toEqual(400);
        expect(res.text).toBe('Faltan atributos');
      });

      it('debería crear un amigo', async () => {
  
        const res = await request(app)
          .post('/amics/create/')
          .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)
          .send({
            friend: 'testUsername2',
          });
    
        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('OK');
    
        const docs = await db.collection('following').where('user', '==', 'testUsername1').get();
        expect(docs.empty).toBeFalsy();
      });
      
      it('debería enviar 401 porque el token no es válido', async () => {

        const res = await request(app)
        .post('/amics/create/')
        .set('Authorization', 'Bearer testUid1')
        .send({
            friend: 'testUsername2',
        });
    
        expect(res.statusCode).toEqual(401);
        expect(res.text).toBe('Token inválido');
        });
        
        it('debería enviar 404 porque el usuario que hace la solicitud no existe', async () => {

            const res = await request(app)
            .post('/amics/create/')
            .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`)
            .send({
                friend: 'testUsername2',
            });
        
            expect(res.statusCode).toEqual(404);
            expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
        });
        
        it('debería enviar 404 porque el usuario que recibe la solicitud no existe', async () => {

            const res = await request(app)
            .post('/amics/create/')
            .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)
            .send({
                friend: 'testUsername3',
            });
        
            expect(res.statusCode).toEqual(404);
            expect(res.text).toBe('Usuario que recibe la solicitud no encontrado');
        });
        /*
        it('debería enviar 400 porque no puedes seguirte a ti mismo', async () => {

            const res = await request(app)
            .post('/amics/create/')
            .send({
                token: encrypt('testUid1').encryptedData,
                friend: 'testUsername1',
            });
        
            expect(res.statusCode).toEqual(400);
            expect(res.text).toBe('No puedes seguirte a ti mismo');
        });

        it('debería enviar 409 porque la solicitud ya ha sido enviada', async () => {

            await db.collection('following').add({ 
                'user': 'testUsername1',
                'friend': 'testUsername2',
                'acceptat': false,
                'pendent': true
            });

            const res = await request(app)
            .post('/amics/create/')
            .send({
                token: encrypt('testUid1').encryptedData,
                friend: 'testUsername2',
            });

            expect(res.statusCode).toEqual(409);
            expect(res.text).toBe('La solicitud ya ha sido enviada');
        });
        */
});

/*
describe('GET /amics/:id/following/', () => {

    const testUsers = [
        {
          uid: 'testUid1',
          username: 'testUsername1',
        },
        {
          uid: 'testUid2',
          username: 'testUsername2',
        },
        {
          uid: 'testUid3',
          username: 'testUsername3',
        }
    ];

    beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('usuaris').doc(usuari.uid).set({"username": usuari.username});
        }
        
        await db.collection('following').add({
            'user': 'testUsername1',
            'friend': 'testUsername2',
            'acceptat': false,
        });

        await db.collection('following').add({
            'user': 'testUsername1',
            'friend': 'testUsername3',
            'acceptat': true,
        });

    });   
    
    it('debería obtener a los usuarios que sigue al usuario cuya id está en la URI', async () => {

        const res = await request(app)
        .get(`/amics/${encrypt('testUid1').encryptedData}/following/`)

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(['testUsername3']);
    });
    
    it('debería enviar 401 porque el token no es válido', async () => {

        const res = await request(app)
        .get(`/amics/testUid1/following/`)
        
        expect(res.statusCode).toEqual(401);
        expect(res.text).toBe('Token no válido');
    });

    it('debería enviar 404 porque el usuario no existe', async () => {

        const res = await request(app)
        .get(`/amics/${encrypt('testUid4').encryptedData}/following/`)
        
        expect(res.statusCode).toEqual(404);
        expect(res.text).toBe('Usuario no encontrado');
    });
    

});


describe('GET /amics/:id/followers/', () => {
    const testUsers = [
        {
          uid: 'testUid1',
          username: 'testUsername1',
        },
        {
          uid: 'testUid2',
          username: 'testUsername2',
        },
        {
          uid: 'testUid3',
          username: 'testUsername3',
        }
    ];

    beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('usuaris').doc(usuari.uid).set({"username": usuari.username});
        }
        
        await db.collection('following').add({
            'user': 'testUsername1',
            'friend': 'testUsername2',
            'acceptat': false,
        });

        await db.collection('following').add({
            'user': 'testUsername1',
            'friend': 'testUsername3',
            'acceptat': true,
        });

    });  

    it('debería obtener a los usuarios que siguen al usuario cuyo nombre de usuario está en la URI', async () => {

        const res = await request(app)
        .get(`/amics/${encrypt('testUid3').encryptedData}/followers/`)

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(['testUsername1']);
    });

    it('debería enviar 401 porque el token no es válido', async () => {

        const res = await request(app)
        .get(`/amics/testUid3/followers/`)
        
        expect(res.statusCode).toEqual(401);
        expect(res.text).toBe('Token no válido');
    });

    it('debería enviar 404 porque el usuario no existe', async () => {

        const res = await request(app)
        .get(`/amics/${encrypt('testUid4').encryptedData}/followers/`)
        
        expect(res.statusCode).toEqual(404);
        expect(res.text).toBe('Usuario no encontrado');
    });
  
});


describe('GET /amics/:id/pendents/', () => {
    const testUsers = [
        {
          uid: 'testUid1',
          username: 'testUsername1',
        },
        {
          uid: 'testUid2',
          username: 'testUsername2',
        },
        {
          uid: 'testUid3',
          username: 'testUsername3',
        }
    ];

    beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('usuaris').doc(usuari.uid).set({"username": usuari.username});
        }
        
        await db.collection('following').add({
            'user': 'testUsername1',
            'friend': 'testUsername2',
            'acceptat': false,
            'pendent': true,
        });

        await db.collection('following').add({
            'user': 'testUsername1',
            'friend': 'testUsername3',
            'acceptat': true,
            'pendent': false,
        });

    });  

    it('debería obtener a los usuarios que tienen pendiente su solicitud al usuario cuyo nombre de usuario está en la URI', async () => {

        const res = await request(app)
        .get(`/amics/${encrypt('testUid2').encryptedData}/pendents/`)

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(['testUsername1']);
    });

    it('debería enviar 401 porque el token no es válido', async () => {

        const res = await request(app)
        .get(`/amics/testUid2/pendents/`)
        
        expect(res.statusCode).toEqual(401);
        expect(res.text).toBe('Token no válido');
    });

    it('debería enviar 404 porque el usuario no existe', async () => {

        const res = await request(app)
        .get(`/amics/${encrypt('testUid4').encryptedData}/pendents/`)
        
        expect(res.statusCode).toEqual(404);
        expect(res.text).toBe('Usuario no encontrado');
    });
  
});*/