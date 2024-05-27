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

describe('POST /notificacio/enviar', () => {
    it('should create a notification', async () => {
        const encryptedData = encrypt(JSON.stringify({
            title: 'titleTest',
            mensaje: 'mensajeTest',
            token: 'tokenTest'
        }));

        const res = await request(app)
            .post('/notificacio/enviar')
            .send(encryptedData); 
  
    });
    
});