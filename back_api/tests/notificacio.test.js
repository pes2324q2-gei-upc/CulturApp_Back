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

const assert = require('assert');
const sinon = require('sinon');
const request = require('supertest');
const server = require('../path/to/your/express/app'); // Adjust the path to your Express app
const admin = require('firebase-admin'); // Assuming you are using Firebase Admin SDK

describe('POST /enviar', () => {
    let sendStub;

    beforeEach(() => {
        sendStub = sinon.stub(admin.messaging(), 'send');
    });

    afterEach(() => {
        sendStub.restore();
    });

    it('should send a notification and return status 201', (done) => {
        sendStub.resolves('mockedResponse');

        request(server)
            .post('/enviar')
            .send({
                title: 'Test Title',
                mensaje: 'Test Message',
                token: 'mockedToken',
            })
            .expect(201)
            .end((err, res) => {
                if (err) return done(err);
                assert.strictEqual(res.text, 'Notificacio enviada');
                done();
            });
    });

    it('should return status 500 if there is an error sending the notification', (done) => {
        sendStub.rejects(new Error('mockedError'));

        request(server)
            .post('/enviar')
            .send({
                title: 'Test Title',
                mensaje: 'Test Message',
                token: 'mockedToken',
            })
            .expect(500)
            .end((err, res) => {
                if (err) return done(err);
                assert.strictEqual(res.text, 'Error enviant la notificació');
                done();
            });
    });
});
