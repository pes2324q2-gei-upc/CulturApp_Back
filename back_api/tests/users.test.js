
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

describe('POST /users/create', () => {
  it('should create a user', async () => {
    const res = await request(app)
      .post('/users/create')
      .send({
        uid: 'testUid',
        username: 'testUser',
        email: 'testEmail',
        favcategories: JSON.stringify(['festa', 'cinema'])
      });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('OK');

    const docs = await db.collection('users').doc('testUid').get();
    expect(docs.empty).toBeFalsy();
  });
});

//OK
describe('POST /users/activitats/signout', () => {
  it('should signout a user from an activity', async () => {
    const users = [
      {
        uid: 'testUid1',
        username: 'testUsername1',
        activitats: ['1', '2', '3'],
      }
    ];

    for (const user of users) {
      await db.collection('users').doc('testUid1').set(user);
    }

    const res = await request(app)
      .post('/users/activitats/signout')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`)
      .send({
        uid: 'testUid1',
        activityId: '2',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('OK');

    const res2 = await request(app)
      .get('/users/activitats/isuserin?uid=testUid1&activityId=2')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res2.statusCode).toEqual(200);
    expect(res2.text).toBe('no');
  });
});

//OK
describe('POST /users/activitats/signup', () => {
  it('should sign up user in activity', async () => {
    const users = [
      {
        uid: 'testUid1',
        username: 'testUsername1',
        activitats: ['1', '2', '3'],
      }
    ];

    for (const user of users) {
      await db.collection('users').doc('testUid1').set(user);
    }

    const res = await request(app)
      .post('/users/activitats/signup')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`)
      .send({
        uid: 'testUid1',
        activityId: '4',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('OK');

    const res2 = await request(app)
      .get('/users/activitats/isuserin?uid=testUid1&activityId=4')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res2.statusCode).toEqual(200);
    expect(res2.text).toBe('yes');
  });
});

//OK
describe('GET /users/activitats/isuserin', () => {
  it('should return if a user is in a activity', async () => {
    // Add test reports to the database
    const users = [
      {
        uid: 'testUid1',
        username: 'testUsername1',
        activities: ['1', '2', '3'],
      }
    ];

    for (const user of users) {
      await db.collection('users').doc('testUid1').set(user);
    }

    const res = await request(app)
      .get('/users/activitats/isuserin?uid=testUid1&activityId=1')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('yes');
  });
});

//OK
describe('GET /users/:uid/username', () => {
  it('should return the username of a user', async () => {
    // Add test reports to the database
    const users = [
      {
        uid: 'testUid1',
        username: 'testUsername1',
        activitats: ['1', '2', '3'],
      }
    ];

    for (const user of users) {
      await db.collection('users').doc('testUid1').set(user);
    }

    const res = await request(app)
      .get('/users/testUid1/username')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('\"testUsername1\"');
  });
});

//OK
describe('GET /users/exists', () => {
  it('should return if a user exists', async () => {
    // Add test reports to the database
    const users = [
      {
        uid: 'testUid1',
        username: 'testUsername1',
        activitats: ['1', '2', '3'],
      }
    ];

    for (const user of users) {
      await db.collection('users').doc('testUid1').set(user);
    }

    const res = await request(app)
      .get('/users/exists?uid=testUid1')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('exists');
  });
});

//OK
describe('GET /users/uniqueUsername', () => {
  it('should return if a username is unique', async () => {
    // Add test reports to the database
    const users = [
      {
        uid: 'testUid1',
        username: 'testUsername1',
        activitats: ['1', '2', '3'],
      }
    ];

    for (const user of users) {
      await db.collection('users').doc('testUid1').set(user);
    }

    const res = await request(app).get('/users/uniqueUsername?username=testUsername1');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('notunique');

    const res2 = await request(app)
      .get('/users/uniqueUsername?username=testUsername2')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res2.statusCode).toEqual(200);
    expect(res2.text).toBe('unique');
  });
});

describe('PUT /users/edit', () => {
  it('should edit a user', async () => {
    const res = await request(app)
      .post('/users/create')
      .send({
        uid: 'testUid',
        username: 'testUser',
        email: 'testEmail',
        favcategories: JSON.stringify(['circ', 'cinema'])
      });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('OK');

    const res2 = await request(app)
      .post('/users/edit')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`)
      .send({
        uid: 'testUid',
        username: 'newUsername',
        favcategories: JSON.stringify(['festa', 'cinema'])
      });

    expect(res2.statusCode).toEqual(200);
    expect(res2.text).toBe('OK');

    const doc = await db.collection('users').doc('testUid').get();
    expect(doc.exists).toBeTruthy();
    expect(doc.data().username).toBe('newUsername');
    expect(doc.data().favcategories).toEqual(['festa', 'cinema']);
  });
});

