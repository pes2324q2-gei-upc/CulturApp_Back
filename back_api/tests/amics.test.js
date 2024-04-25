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

      it('deberia enviar 400 porque faltan atributos', async () => {
  
        const res = await request(app)
        .post('/amics/create/')
        .send({
          token: encrypt('testUid1'),
        });
  
        expect(res.statusCode).toEqual(400);
        expect(res.text).toBe('Faltan atributos');
      });

      it('deberia crear un amigo', async () => {
  
        const res = await request(app)
          .post('/amics/create/')
          .send({
            token: encrypt('testUid1'),
            friend: 'testUsername2',
          });
    
        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('OK');
    
        const docs = await db.collection('following').where('user', '==', 'testUid1').get();
        expect(docs.empty).toBeFalsy();
      });

      it('deberia enviar 401 porque el token no es hexadecimal', async () => {

        const res = await request(app)
        .post('/amics/create/')
        .send({
            token: 'testUid1',
            friend: 'testUsername2',
        });
    
        expect(res.statusCode).toEqual(401);
        expect(res.text).toBe('El token no es hexadecimal');
        });

        it('deberia enviar 404 porque el usuario que hace la solicitud no existe', async () => {

            const res = await request(app)
            .post('/amics/create/')
            .send({
                token: encrypt('testUid3'),
                friend: 'testUsername2',
            });
        
            expect(res.statusCode).toEqual(404);
            expect(res.text).toBe('Usuario que hace la solicitud no encontrado');
        });

        it('deberia enviar 404 porque el usuario que recibe la solicitud no existe', async () => {

            const res = await request(app)
            .post('/amics/create/')
            .send({
                token: encrypt('testUid1'),
                friend: 'testUsername3',
            });
        
            expect(res.statusCode).toEqual(404);
            expect(res.text).toBe('Usuario que recibe la solicitud no encontrado');
        });

        it('deberia enviar 400 porque no puedes seguirte a ti mismo', async () => {

            const res = await request(app)
            .post('/amics/create/')
            .send({
                token: encrypt('testUid1'),
                friend: 'testUsername1',
            });
        
            expect(res.statusCode).toEqual(400);
            expect(res.text).toBe('No puedes seguirte a ti mismo');
        });

        it('deberia enviar 409 porque la solicitud ya ha sido enviada', async () => {

            await db.collection('following').add({ 
                'user': 'testUid1',
                'friend': 'testUid2',
                'acceptat': false,
                'pendent': true
            });

            const res = await request(app)
            .post('/amics/create/')
            .send({
                token: encrypt('testUid1'),
                friend: 'testUsername2',
            });

            expect(res.statusCode).toEqual(409);
            expect(res.text).toBe('La solicitud ya ha sido enviada');
        });
});