const request = require('supertest');
const app = require('../app'); 

const crypto = require('crypto');
const e = require('express');
const { nextTick } = require('process');
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');

function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

describe('GET /xats/:xatId/mensjaes', () => {
    const xats = [
       xat1 =  {
            id: "1",
            senderId: "user1",
            receiverId: "user2",
            last_msg: "",
            last_time: ""
        },
        xat2 = {
            id: "2",
            senderId: "user1",
            receiverId: "user3",
            last_msg: "",
            last_time: ""
        }
    ];
    const mensajes = [
        mensaje1 = {
            senderId: "user1",
            mensaje: "hola",
            fecha: "2021-06-01T10:00:00Z"
        },
        mensaje2 ={
            senderId: "user2",
            mensaje: "hola",
            fecha: "2021-08-01T10:00:00Z"
        },
        mensaje3 = {
            senderId: "user3",
            mensaje: "hola",
            fecha: "2021-07-01T10:00:00Z"
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
            blockedUsers: []
        },
        user3 = {
            id: "user3",
            username: "user3",
            email: "",
            blockedUsers: []
        }
    ];
    beforeEach(async () => {
        const snapshot = await db.collection('mensajes').get();

        if(!snapshot.empty) {    
            const deletePromises = snapshot.docs.map(doc => db.collection('mensajes').doc(doc.id).delete());
            await Promise.all(deletePromises);
        }
        await db.collection('xats').doc('1').set(xat1);
        await db.collection('xats').doc('2').set(xat2);
        await db.collection('xats').doc('2').collection('mensajes').add(mensaje1);
        await db.collection('xats').doc('2').collection('mensajes').add(mensaje3);
        await db.collection('xats').doc('1').collection('mensajes').add(mensaje1);
        await db.collection('xats').doc('1').collection('mensajes').add(mensaje2);
        await db.collection('users').doc('user1').set(user1);
        await db.collection('users').doc('user2').set(user2);
        await db.collection('users').doc('user3').set(user3);
    });
    it('should return all messages from a xat', async () => {
        const response = await request(app)
            .get(`/xats/2/mensajes`)
            .set('Authorization', `Bearer ${encrypt('user1').encryptedData}`)
        expect(response.status).toEqual(200);
    });
    it('should not return any message because the user is blocked', async () => {
        const response = await request(app)
            .get(`/xats/1/mensajes`)
            .set('Authorization', `Bearer ${encrypt('user1').encryptedData}`)
        expect(response.status).toEqual(200);
        expect(response.text).toEqual('Usuario bloqueado');
    });
    it('should return 401 because the user is not authorized', async () => {
        const xatId = "2";
        const response = await request(app)
            .get(`/xats/${xatId}/mensajes`)
        expect(response.status).toEqual(401);
    });
    it('should return 403 because the user is not part of the xat', async () => {
        const xatId = "2";
        const response = await request(app)
            .get(`/xats/${xatId}/mensajes`)
            .set('Authorization', `Bearer ${encrypt('user2').encryptedData}`)
        expect(response.status).toEqual(403);
        expect(response.text).toEqual('Forbidden');
    });
});
describe ('POST /xats/:xatId/mensajes', () => {
    const xats = [
        xat1 =  {
             id: "1",
             senderId: "user1",
             receiverId: "user2",
             last_msg: "",
             last_time: ""
         },
         xat2 = {
             id: "2",
             senderId: "user1",
             receiverId: "user3",
             last_msg: "",
             last_time: ""
         }
     ];
     const mensajes = [
         mensaje1 = {
             senderId: "user1",
             mensaje: "hola",
             fecha: "2021-06-01T10:00:00Z"
         },
         mensaje2 ={
             senderId: "user2",
             mensaje: "hola",
             fecha: "2021-08-01T10:00:00Z"
         },
         mensaje3 = {
             senderId: "user3",
             mensaje: "hola",
             fecha: "2021-07-01T10:00:00Z"
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
             blockedUsers: []
         },
         user3 = {
             id: "user3",
             username: "user3",
             email: "",
             blockedUsers: []
         }
     ];
     beforeEach(async () => {
        for (const xat of xats) {
            await db.collection('xats').doc(xat.id).set(xat);
        }
        for (const user of users) {
            await db.collection('users').doc(user.id).set(user);
        }
    });
    it('should return 201 because the message was created', async () => {
        const response = await request(app)
            .post(`/xats/2/mensajes`)
            .send({
                mensaje: "hola",
                fecha: "2021-06-01T10:00:00Z"
            })
            .set('Authorization', `Bearer ${encrypt('user1').encryptedData}`);
        expect(response.status).toEqual(201);
    });
    it('should return 200 because the user is blocked', async () => {
        const response = await request(app)
            .post(`/xats/1/mensajes`)
            .send({
                mensaje: "hola",
                fecha: "2021-06-01T10:00:00Z"
            })
            .set('Authorization', `Bearer ${encrypt('user1').encryptedData}`);
        expect(response.status).toEqual(200);
        expect(response.text).toEqual('Usuario bloqueado');
    });
    it('should return 401 because the user is not authorized', async () => {
        const response = await request(app)
            .post(`/xats/2/mensajes`)
            .send({
                mensaje: "hola",
                fecha: "2021-06-01T10:00:00Z"
            });
        expect(response.status).toEqual(401);
    });
    it('should return 403 because the user is not part of the xat', async () => {
        const response = await request(app)
            .post(`/xats/2/mensajes`)
            .send({
                mensaje: "hola",
                fecha: "2021-06-01T10:00:00Z"
            })
            .set('Authorization', `Bearer ${encrypt('user2').encryptedData}`);
        expect(response.status).toEqual(403);
        expect(response.text).toEqual('Forbidden');
    });
});
describe('POST /xats/create', () => {
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
            blockedUsers: []
        },
        user3 = {
            id: "user3",
            username: "user3",
            email: "",
            blockedUsers: []
        }
    ];
    beforeEach(async () => {
        for (const user of users) {
            await db.collection('users').doc(user.id).set(user);
        }
    });
    it('should return 201 because the xat was created', async () => {
        const response = await request(app)
            .post('/xats/create')
            .send({
                receiver: "user3"
            })
            .set('Authorization', `Bearer ${encrypt('user1').encryptedData}`);
        expect(response.status).toEqual(201);
    });
    it('should return 200 because the user is blocked', async () => {
        const response = await request(app)
            .post('/xats/create')
            .send({
                receiver: "user2"
            })
            .set('Authorization', `Bearer ${encrypt('user1').encryptedData}`);
        expect(response.status).toEqual(200);
        expect(response.text).toEqual('Usuario bloqueado');
    });
    it('should return 401 because the user is not authorized', async () => {
        const response = await request(app)
            .post('/xats/create')
            .send({
                receiver: "user3"
            });
        expect(response.status).toEqual(401);
    });
});
