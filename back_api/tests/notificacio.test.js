const request = require('supertest');
const app = require('../app'); 
const admin = require('firebase-admin');

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

jest.mock('firebase-admin', () => {
    const messaging = {
      send: jest.fn(),
    };
    return {
      messaging: () => messaging,
    };
  });

describe('POST /notificacio/enviar', () => {
    const users = [
        user1 = {
            id: "user1",
            username: "user1",
            email: "",
            blockedUsers: ["user2"]
        },
    ];

    beforeEach(async () => {
        for (const user of users) {
            await db.collection('users').doc(user.id).set(user);
        }
    });

    it('should create a notification', async () => {
        admin.messaging().send.mockResolvedValue('Successfully sent message');
        const body = {
            title: 'titleTest',
            mensaje: 'mensajeTest',
            token: 'tokenTest'
        };

        const res = await request(app)
            .post('/notificacio/enviar')
            .set('Authorization', `Bearer ${encrypt('user1').encryptedData}`)
            .send(body); 
        
        expect(res.statusCode).toEqual(201);
        expect(res.text).toBe('Notificacio enviada');
    });
    
});