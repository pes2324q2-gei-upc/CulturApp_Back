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

const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const server = require('../path/to/your/express/app'); // Adjust the path to your Express app
const admin = require('firebase-admin'); // Assuming you are using Firebase Admin SDK

chai.use(chaiHttp);
const { expect } = chai;

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

        chai.request(server)
            .post('/enviar')
            .send({
                title: 'Test Title',
                mensaje: 'Test Message',
                token: 'mockedToken',
            })
            .end((err, res) => {
                expect(res).to.have.status(201);
                expect(res.text).to.equal('Notificacio enviada');
                done();
            });
    });

    it('should return status 500 if there is an error sending the notification', (done) => {
        sendStub.rejects(new Error('mockedError'));

        chai.request(server)
            .post('/enviar')
            .send({
                title: 'Test Title',
                mensaje: 'Test Message',
                token: 'mockedToken',
            })
            .end((err, res) => {
                expect(res).to.have.status(500);
                expect(res.text).to.equal('Error enviant la notificació');
                done();
            });
    });
});