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

describe('GET /grups/:groupId', () => {
    const grups = [
        grup1 = {
            id: "1",
            nom: "grup1",
            descripcio: "descripcio1",
            imatge: "",
            participants: ["user1", "user2"],
            last_msg: "",
            last_time: ""
        },
        grup2 = {
            id: "2",
            nom: "grup2",
            descripcio: "descripcio2",
            imatge: "",
            participants: ["user1", "user3"],
            last_msg: "",
            last_time: ""
        }
    ];  
    const users = [
        user1 = {
            id: "user1",
            username: "user1",
            email: "",
            blockedUsers: ["user2"]
        },
        user2 = {
            id: "user2",
            username: "user2",
            email: "",
            blockedUsers: ["user1"]
        },
        user3 = {
            id: "user3",
            username: "user3",
            email: "",
            blockedUsers: []
        }
    ];
    beforeEach(async () => {
        for (let i = 0; i < grups.length; i++) {
            let groupId = grups[i].id;
            await db.collection('grups').doc(groupId).set(grups[i]);
        }
        for (let i = 0; i < users.length; i++) {
            let username = users[i].username;
            await db.collection('users').doc(username).set(users[i]);
        }
    });
    it('should return the group', async () => {
        const res = await request(app)
        .get('/grups/1')
        .set('Authorization', 'Bearer ' + encrypt('user1').encryptedData);
        expect(res.statusCode).toEqual(200);
    });
    it('should return 403 if the user is not part of the group', async () => {
        const res = await request(app)
        .get('/grups/2')
        .set('Authorization', 'Bearer ' + encrypt('user2').encryptedData);
        expect(res.statusCode).toEqual(403);
        expect(res.text).toEqual('Forbidden');
    });
    it('should return 404 if the group does not exist', async () => {
        const res = await request(app)
        .get('/grups/3')
        .set('Authorization', 'Bearer ' + encrypt('user1').encryptedData);
        expect(res.statusCode).toEqual(404);
    });
    it('should return 401 if the user is not authenticated', async () => {
        const res = await request(app)
        .get('/grups/1')
        .set('Authorization', 'Bearer encryptedData');
        expect(res.statusCode).toEqual(401);
    });
});
describe('POST /grups/:groupId/mensajes', () => {
    const grups = [
        grup1 = {
            id: "1",
            nom: "grup1",
            descripcio: "descripcio1",
            imatge: "",
            participants: ["user1", "user2"],
            last_msg: "",
            last_time: ""
        },
        grup2 = {
            id: "2",
            nom: "grup2",
            descripcio: "descripcio2",
            imatge: "",
            participants: ["user1", "user3"],
            last_msg: "",
            last_time: ""
        }
    ];  
    const users = [
        user1 = {
            id: "user1",
            username: "user1",
            email: "",
            blockedUsers: ["user2"]
        },
        user2 = {
            id: "user2",
            username: "user2",
            email: "",
            blockedUsers: ["user1"]
        },
        user3 = {
            id: "user3",
            username: "user3",
            email: "",
            blockedUsers: []
        }
    ];
    beforeEach(async () => {
        for (let i = 0; i < grups.length; i++) {
            let groupId = grups[i].id;
            await db.collection('grups').doc(groupId).set(grups[i]);
        }
        for (let i = 0; i < users.length; i++) {
            let username = users[i].username;
            await db.collection('users').doc(username).set(users[i]);
        }
    });
    it('should return 201 if the message is created', async () => {
        const res = await request(app)
        .post('/grups/1/mensajes')
        .send({
            mensaje: "mensaje",
            fecha: "fecha"
        })
        .set('Authorization', 'Bearer ' + encrypt('user1').encryptedData);
        expect(res.statusCode).toEqual(201);
    });
    it('should return 403 if the user is not part of the group', async () => {
        const res = await request(app)
        .post('/grups/2/mensajes')
        .send({
            mensaje: "mensaje",
            fecha: "fecha"
        })
        .set('Authorization', 'Bearer ' + encrypt('user2').encryptedData);
        expect(res.statusCode).toEqual(403);
        expect(res.text).toEqual('Forbidden');
    });
    it('should return 404 if the group does not exist', async () => {
        const res = await request(app)
        .post('/grups/3/mensajes')
        .send({
            mensaje: "mensaje",
            fecha: "fecha"
        })
        .set('Authorization', 'Bearer ' + encrypt('user1').encryptedData);
        expect(res.statusCode).toEqual(404);
    });
    it('should return 401 if the user is not authenticated', async () => {
        const res = await request(app)
        .post('/grups/1/mensajes')
        .send({
            mensaje: "mensaje",
            fecha: "fecha"
        })
        .set('Authorization', 'Bearer encryptedData');
        expect(res.statusCode).toEqual(401);
    });
});