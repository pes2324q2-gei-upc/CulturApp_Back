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

describe('GET /organitzadors/llistarActivitats', () => {
  const organitzadors = [
    org1 = {
      user: 'user1',
      activitat: 'activitat1'
    },
    org2 = {
      user: 'user2',
      activitat: 'activitat2'
    }
  ];
  const acts = [
    act1 = {
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
    },
    act2 = {
      denominaci: "testNom2",
      descripcio: "testDescripcio2",
      data_inici: "2024-02-02T00:00:00.000",
      data_fi: "testDataFi2",
      tags_categor_es: ["testTag1", "testTag2"],
      ubicacio: "testUbicacio2",
      aforament: 100,
      aforament_actual: 50,
      assistents: ["testUid2"],
      assistents_actuals: 1
    }
  ];
  beforeEach(async () => {
    for (let i = 0; i < organitzadors.length; i++) {
      await db.collection('organitzadors').doc(`user${i}`).set(organitzadors[i]);
    }
    for (let i = 0; i < acts.length; i++) {
      doc_id = organitzadors[i].activitat;
      await db.collection('actividades').doc(doc_id).set(acts[i]);
    }
    db.collection('administradors').doc('admin').set({ user: 'admin' });
  });
  it('should return all the activities', async () => {
    const res = await request(app)
      .get('/organitzadors/llistarActivitats')
      .set('Authorization', `Bearer ${encrypt('admin').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(acts);
  });
  it('should return 404 if the user is not an admin', async () => {
    const res = await request(app)
      .get('/organitzadors/llistarActivitats')
      .set('Authorization', `Bearer ${encrypt('user').encryptedData}`);
    expect(res.statusCode).toEqual(404);
  });
  it('should return 401 if token is not valid', async () => {
    const res = await request(app)
      .get('/organitzadors/llistarActivitats')
      .set('Authorization', 'Bearer invalid');
    expect(res.statusCode).toEqual(401);
  });
});

describe('GET /organitzadors/activitat/:id/organitzadors', () => {
  const organitzadors = [
    org1 = {
      user: 'user1',
      activitat: 'activitat1'
    },
    org2 = {
      user: 'user2',
      activitat: 'activitat1'
    }
  ];
  const users = [
    user1 = {
      username: 'testUser1',
      email: 'testEmail1',
      password: 'testPassword1'
    },
    user2 = {
      username: 'testUser2',
      email: 'testEmail2',
      password: 'testPassword2'
    }
  ];
  beforeEach(async () => {
    for (let i = 0; i < organitzadors.length; i++) {
      await db.collection('organitzadors').doc(`user${i}`).set(organitzadors[i]);
    }
    for (let i = 0; i < users.length; i++) {
      doc_id = organitzadors[i].user;
      await db.collection('users').doc(doc_id).set(users[i]);
    }
    db.collection('administradors').doc('admin').set({ user: 'admin' });
  });
  it('should return all the organizers of the activity', async () => {
    const res = await request(app)
      .get('/organitzadors/activitat/activitat1/organitzadors')
      .set('Authorization', `Bearer ${encrypt('admin').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(users);
  });
  it('should return 404 if the user is not an admin', async () => {
    const res = await request(app)
      .get('/organitzadors/activitat/activitat1/organitzadors')
      .set('Authorization', `Bearer ${encrypt('user').encryptedData}`);
    expect(res.statusCode).toEqual(404);
  });
  it('should return 401 if token is not valid', async () => {
    const res = await request(app)
      .get('/organitzadors/activitat/activitat1/organitzadors')
      .set('Authorization', 'Bearer invalid');
    expect(res.statusCode).toEqual(401);
  });
});