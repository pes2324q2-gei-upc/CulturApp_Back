
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

describe('POST /users/activitats/signout', () => {
  it('should signout a user from an activity', async () => {
    const users = [
      {
        uid: 'testUid1',
        username: 'testUsername1',
        activities: ['1', '2', '3'],
      }
    ];

    for (const user of users) {
      await db.collection('users').doc(user.uid).set(user);
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
      .get('/users/activitats/isuserin?id=testUid1&activityId=2')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res2.statusCode).toEqual(200);
    expect(res2.text).toBe('no');
  });

  it('should return Not Found if the user does not exist', async () => {
    const res = await request(app)
      .post('/users/activitats/signout')
      .set('Authorization',  `Bearer ${encrypt('nonexistentUid').encryptedData}`)
      .send({
        uid: 'nonexistentUid',
        activityId: '2',
      });

    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
  });
});

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
      await db.collection('users').doc(user.uid).set(user);
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
      .get('/users/activitats/isuserin?id=testUid1&activityId=4')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res2.statusCode).toEqual(200);
    expect(res2.text).toBe('yes');
  });

  it('should return "El usuario no existe" if the user does not exist', async () => {
    const res = await request(app)
      .post('/users/activitats/signup')
      .set('Authorization',  `Bearer ${encrypt('nonexistentUid').encryptedData}`)
      .send({
        uid: 'nonexistentUid',
        activityId: '4',
      });

    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
  });
});

describe('GET /users/activitats/isuserin', () => {
  it('should return if a user is in a activity', async () => {
    const users = [
      {
        uid: 'testUid1',
        username: 'testUsername1',
        activities: ['1', '2', '3'],
      }
    ];

    for (const user of users) {
      await db.collection('users').doc(user.uid).set(user);
    }

    let res = await request(app)
      .get('/users/activitats/isuserin?id=testUid1&activityId=1')
      .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('yes');

    res = await request(app)
      .get('/users/activitats/isuserin?id=testUid1&activityId=4')
      .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('no');

    res = await request(app)
      .get('/users/activitats/isuserin?id=testUid2&activityId=1')
      .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res.statusCode).toEqual(401);
    expect(res.text).toBe('Forbidden');

    res = await request(app)
      .get('/users/activitats/isuserin?id=nonexistentUid&activityId=1')
      .set('Authorization', `Bearer ${encrypt('nonexistentUid').encryptedData}`);

    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
  });
});

describe('GET /users/:uid/username', () => {
  it('should return the username of a user', async () => {
    const users = [
      {
        uid: 'testUid1',
        username: 'testUsername1',
        activitats: ['1', '2', '3'],
      },
      {
        uid: 'testUid2',
        username: 'testUsername2',
        activitats: ['1', '2', '3'],
      }
    ];

    for (const user of users) {
      await db.collection('users').doc(user.uid).set(user);
    }

    res = await request(app)
      .get('/users/testUid1/username')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('\"testUsername1\"');

    res = await request(app)
      .get('/users/testUid1/username')
      .set('Authorization',  `Bearer ${encrypt('testUid2').encryptedData}`);

    expect(res.statusCode).toEqual(401);
    expect(res.text).toBe('Forbidden');

    res = await request(app)
      .get('/users/testUid3/username')
      .set('Authorization',  `Bearer ${encrypt('testUid3').encryptedData}`);

    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
  });
});

//OK
describe('GET /users/exists', () => {
  it('should return if a user exists', async () => {
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
      .get('/users/exists?uid=testUid1')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('exists');
  });
  it('should return if a user does not exist', async () => {
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
      .get('/users/exists?uid=testUid2')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('notexists');
  });
});

describe('GET /users/uniqueUsername', () => {
  it('should return if a username is not unique', async () => {
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
    .get('/users/uniqueUsername?username=testUsername1')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('notunique');
  });
  it('should return if a username is unique', async () => {
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
        uid: 'testUid1',
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
        uid: 'testUid1',
        username: 'newUsername',
        favcategories: JSON.stringify(['festa', 'cinema'])
      });

    expect(res2.statusCode).toEqual(200);
    expect(res2.text).toBe('OK');

    const doc = await db.collection('users').doc('testUid1').get();
    expect(doc.exists).toBeTruthy();
    expect(doc.data().username).toBe('newUsername');
    expect(doc.data().favcategories).toEqual(['festa', 'cinema']);
  });
});


describe('GET /users/:id', () => {
  const testUsers = [
      usertes1 = {
          id: 'useridTest1',
          username: 'username',
          email: 'email',
          activitats: ['1', '2', '3'],
      },
      usertest2 = {
          id: 'useridTest2',
          username: 'username2',
          email: 'email2',
          activitats: ['1', '2', '3'],
      }
  ]
  beforeEach(async () => {
    await db.collection('administradors').doc('adminUid').set({'username': 'adminUsername'});
      for(const user of testUsers) {
          const userRef = db.collection('users').doc(user.id);
          await userRef.set(user);
      }
  });
  it('should return 200 and user data', async () => {
      const user = testUsers[0];
      const response = await request(app)
          .get(`/users/${user.id}`)
          .set('Authorization', `Bearer ${encrypt('adminUid').encryptedData}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(user);
  });
  it('should return 401 if token is invalid', async () => {
      const response = await request(app)
          .get(`/users/${testUsers[0].id}`)
          .set('Authorization', 'Bearer invalidToken');
      expect(response.status).toBe(401);
      expect(response.text).toBe('Token inválido');
  });
  it('should return 404 if user who is beeing searched does not exist', async () => {
      const response = await request(app)
          .get(`/users/invalidId`)
          .set('Authorization', `Bearer ${encrypt('adminUid').encryptedData}`);
      expect(response.status).toBe(404);
      expect(response.text).toBe('Usuario no encontrado');
  });
  it('should return 404 if user does not exist', async () => {
      const response = await request(app)
          .get(`/users/useridTest1`)
          .set('Authorization', `Bearer ${encrypt('invaldId').encryptedData}`);
      expect(response.status).toBe(404);
      expect(response.text).toBe('Admin no encontrado');
  });
});
describe('GET /users/infoToken', () => {
    const testUsers = [
        usertes1 = {
            id: 'useridTest1',
            username: 'username',
            email: 'email',
            token: "10b79ecbebb4da0fedff89edf6a504f5",
            activitats: ['1', '2', '3'],
        },
        usertest2 = {
            id: 'useridTest2',
            username: 'username2',
            email: 'email2',
            token: "10b79ecbebb4da0fedff89edf6a504f5",
            activitats: ['1', '2', '3'],
        }
    ]
    beforeEach(async () => {
        for(const user of testUsers) {
            const userRef = db.collection('users').doc(user.id);
            await userRef.set(user);
        }
    });
    it('should return 200 and user data', async () => {
        const user = testUsers[0];
        const response = await request(app)
            .get(`/users/infoToken`)
            .set('Authorization', `Bearer useridTest1`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(user);
    });
    it('should return 404 if user does not exist', async () => {
        const response = await request(app)
            .get(`/users/infoToken`)
            .set('Authorization', `Bearer invalid`);
        expect(response.status).toBe(404);
        expect(response.text).toBe('Usuario no encontrado');
    });
});
describe('GET /users/:id', () => {
    const testUsers = [
        usertes1 = {
            id: 'useridTest1',
            username: 'username',
            email: 'email',
            token: "10b79ecbebb4da0fedff89edf6a504f5",
            activitats: ['1', '2', '3'],
        },
        usertest2 = {
            id: 'useridTest2',
            username: 'username2',
            email: 'email2',
            token: "10b79ecbebb4da0fedff89edf6a504f5",
            activitats: ['1', '2', '3'],
        }
    ]
    beforeEach(async () => {
        const adminUser = {
        uid: 'adminUid',
        username: 'adminUsername',
      };
      // Then add the admin user to the 'admin' collection
      await db.collection('administradors').doc(adminUser.uid).set({'username': adminUser.username});
        for(const user of testUsers) {
            const userRef = db.collection('users').doc(user.id);
            await userRef.set(user);
        }
        
    });
    it('should return 200 and user data', async () => {
        const user = testUsers[0];
        const response = await request(app)
            .get(`/users/${user.id}`)
            .set('Authorization', `Bearer ${encrypt('adminUid').encryptedData}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(user);
    });
    it('should return 401 if token is invalid', async () => {
        const response = await request(app)
            .get(`/users/${testUsers[0].id}`)
            .set('Authorization', 'Bearer invalidToken');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Token inválido');
    });
    it('should return 404 if user does not exist', async () => {
        const response = await request(app)
            .get(`/users/invalidId`)
            .set('Authorization', `Bearer ${encrypt('adminUid').encryptedData}`);
        expect(response.status).toBe(404);
        expect(response.text).toBe('Usuario no encontrado');
    });
});


describe('GET /users/read/users', () => {
  const testUsers = [
      usertes1 = {
          id: 'useridTest1',
          username: 'username',
          email: 'email',
          activitats: ['1', '2', '3'],
      },
      usertest2 = {
          id: 'useridTest2',
          username: 'username2',
          email: 'email2',
          activitats: ['1', '2', '3'],
      }
  ]
  beforeEach(async () => {
      for(const user of testUsers) {
          const userRef = db.collection('users').doc(user.id);
          await userRef.set(user);
      }
  });
  it('should return 200 and user data', async () => {
      const response = await request(app)
          .get(`/users/read/users`)
          .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(testUsers);
  });
  it('should return 401 if token is invalid', async () => {
      const response = await request(app)
          .get(`/users/read/users`)
          .set('Authorization', 'Bearer invalidToken');
      expect(response.status).toBe(401);
      expect(response.text).toBe('Token inválido');
  });
  it('should return 404 if user does not exist', async () => {
      const response = await request(app)
          .get(`/users/read/users`)
          .set('Authorization', `Bearer ${encrypt('invaldId').encryptedData}`);
      expect(response.status).toBe(404);
      expect(response.text).toBe('Usuario o cliente que envió la solicitud no encontrado');
  });
});


describe('GET /users/:id/activitats', () => {
  const testUsers = [
      usertes1 = {
          id: 'useridTest1',
          username: 'username',
          email: 'email',
          activities: ['1', '2'],
      },
      usertest2 = {
          id: 'useridTest2',
          username: 'username2',
          email: 'email2',
          activities: ['1', '2'],
      }
  ]
  const testActivitats = [
      activitat1 = {
          id: '1',
          name: 'name',
          description: 'description',
          date: 'date',
          location: 'location',
          participants: ['useridTest1', 'useridTest2'],
      },
      activitat2 = {
          id: '2',
          name: 'name2',
          description: 'description2',
          date: 'date2',
          location: 'location2',
          participants: ['useridTest1', 'useridTest2'],
      }
  ]
  beforeEach(async () => {
      for(const user of testUsers) {
          const userRef = db.collection('users').doc(user.id);
          await userRef.set(user);
      }
      for(const activitat of testActivitats) {
          const activitatRef = db.collection('actividades').doc(activitat.id);
          await activitatRef.set(activitat);
      }
  });
  it('should return 200 and user data', async () => {
      const user = testUsers[0];
      const response = await request(app)
          .get(`/users/username2/activitats`)
          .set('Authorization', `Bearer ${encrypt("useridTest2").encryptedData}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(testActivitats);
  });
  it('should return 401 if token is invalid', async () => {
      const response = await request(app)
          .get(`/users/${testUsers[0].id}/activitats`)
          .set('Authorization', 'Bearer invalidToken');
      expect(response.status).toBe(401);
      expect(response.text).toBe('Token inválido');
  });
  it('should return 404 if user who is beeing searched does not exist', async () => {
      const response = await request(app)
          .get(`/users/invalidId/activitats`)
          .set('Authorization', `Bearer ${encrypt('invalidId').encryptedData}`);
      expect(response.status).toBe(404);
      expect(response.text).toBe('Usuario que envió la solicitud no encontrado');
  });
});

describe('GET /users/activitats/search/:name', () => {
  const testUsers = [
      usertes1 = {
          id: 'useridTest1',
          username: 'username',
          email: 'email',
          activities: ['1', '2', '3'],
      },
      usertest2 = {
          id: 'useridTest2',
          username: 'username2',
          email: 'email2',
          activities: ['1', '2', '3'],
      }
  ]
  const testActivitats = [
      activitat1 = {
          id: '1',
          denominaci: 'name',
          description: 'description',
          date: 'date',
          location: 'location',
          categoria: 'categoria1',
      },
      activitat2 = {
          id: '2',
          denominaci: 'name2',
          description: 'description2',
          date: 'date2',
          location: 'location2',
          categoria: 'categoria2',
      }
  ]
  beforeEach(async () => {
      for(const user of testUsers) {
          const userRef = db.collection('users').doc(user.id);
          await userRef.set(user);
      }
      for(const activitat of testActivitats) {
          const activitatRef = db.collection('actividades').doc(activitat.id);
          await activitatRef.set(activitat);
      }
  });
  it('should return 200 and user data', async () => {
      const response = await request(app)
          .get(`/users/activitats/search/name2`)
          .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([testActivitats[1]]);
  });
  it('should return 401 if token is invalid', async () => {
      const response = await request(app)
          .get(`/users/activitats/search/name2`)
          .set('Authorization', 'Bearer invalidToken');
      expect(response.status).toBe(401);
      expect(response.text).toBe('Token inválido');
  });
  it('should return 404 if user does not exist', async () => {
      const response = await request(app)
          .get(`/users/activitats/search/name2`)
          .set('Authorization', `Bearer ${encrypt('invaldId').encryptedData}`);
      expect(response.status).toBe(404);
      expect(response.text).toBe('Usuario que envió la solicitud no encontrado');
  });
  it('should return 200 empty array if there are no activities with the name', async () => {
      const response = await request(app)
          .get(`/users/activitats/search/invalidName`)
          .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
  });
});

describe('GET /users/categoires/:categories', () => {
  const testUsers = [
      usertes1 = {
          id: 'useridTest1',
          username: 'username',
          email: 'email',
          activities: ['1', '2', '3'],
      },
      usertest2 = {
          id: 'useridTest2',
          username: 'username2',
          email: 'email2',
          activities: ['1', '2', '3'],
      }
  ]
  const testActivitats = [
      activitat1 = {
          id: '1',
          denominaci: 'name',
          description: 'description',
          date: 'date',
          location: 'location',
          tags_categor_es: ['categoria1'],
      },
      activitat2 = {
          id: '2',
          denominaci: 'name2',
          description: 'description2',
          date: 'date2',
          location: 'location2',
          tags_categor_es: ['categoria2'],
      }
  ]
  beforeEach(async () => {
      for(const user of testUsers) {
          const userRef = db.collection('users').doc(user.id);
          await userRef.set(user);
      }
      for(const activitat of testActivitats) {
          const activitatRef = db.collection('actividades').doc(activitat.id);
          await activitatRef.set(activitat);
      }
  });
  it('should return 200 and user data', async () => {
      const response = await request(app)
          .get(`/users/categories/categoria2`)
          .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([testActivitats[1]]);
  });
  it('should return 200 and user data', async () => {
      const response = await request(app)
          .get(`/users/categories/categoria1,categoria2`)
          .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([testActivitats[0], testActivitats[1]]);
  });
  it('should return 401 if token is invalid', async () => {
      const response = await request(app)
          .get(`/users/categories/categoria2`)
          .set('Authorization', 'Bearer invalidToken');
      expect(response.status).toBe(401);
      expect(response.text).toBe('Token inválido');
  });
  it('should return 404 if user does not exist', async () => {
      const response = await request(app)
          .get(`/users/categories/categoria2`)
          .set('Authorization', `Bearer ${encrypt('invaldId').encryptedData}`);
      expect(response.status).toBe(404);
      expect(response.text).toBe('Usuario que envió la solicitud no encontrado');
  });
  it('should return 200 empty array if there are no activities with the category', async () => {
      const response = await request(app)
          .get(`/users/categories/invalidCategory`)
          .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
  });
});

describe('GET /users/data/:data', () => {
  const testUsers = [
      usertes1 = {
          id: 'useridTest1',
          username: 'username',
          email: 'email',
          activities: ['1', '2', '3'],
      },
      usertest2 = {
          id: 'useridTest2',
          username: 'username2',
          email: 'email2',
          activities: ['1', '2', '3'],
      }
  ]
  const testActivitats = [
      activitat1 = {
          id: '1',
          denominaci: "testNom",
          descripcio: "testDescripcio",
          data_inici: "2024-02-02T00:00:00.000",
          data_fi: "testDataFi",
          tags_categor_es: ["testTag1", "testTag2"],
          ubicacio: "testUbicacio1",
          aforament: 100,
          aforament_actual: 50,
          assistents: ["testUid1"],
          assistents_actuals: 1
      },
      activitat2 = {
          id: '2',
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
        }
  ]
  beforeEach(async () => {
      for(const user of testUsers) {
          const userRef = db.collection('users').doc(user.id);
          await userRef.set(user);
      }
      for(const activitat of testActivitats) {
          const activitatRef = db.collection('actividades').doc(activitat.id);
          await activitatRef.set(activitat);
      }
  });
  it('should return 200 and user data', async () => {
      const response = await request(app)
          .get(`/users/data/2024-02-02T00:00:00.000`)
          .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([testActivitats[0], testActivitats[1]]);
  });
  it('should return 401 if token is invalid', async () => {
      const response = await request(app)
          .get(`/users/data/2024-02-02T00:00:00.000`)
          .set('Authorization', 'Bearer invalidToken');
      expect(response.status).toBe(401);
      expect(response.text).toBe('Token inválido');
  });
  it('should return 404 if user does not exist', async () => {
      const response = await request(app)
          .get(`/users/data/2024-02-02T00:00:00.000`)
          .set('Authorization', `Bearer ${encrypt('invaldId').encryptedData}`);
      expect(response.status).toBe(404);
      expect(response.text).toBe('Usuario que envió la solicitud no encontrado');
  });
  it('should return 200 empty array if there are no activities with the date', async () => {
      const response = await request(app)
          .get(`/users/data/2024-12-02T00:00:00.000`)
          .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
  });
});
describe('POST /users/:id/ban', () => {
  const testUsers = [
    usertes1 = {
        id: 'useridTest1',
        username: 'username',
        email: 'email',
        activities: ['1', '2', '3'],
    },
    usertest2 = {
        id: 'useridTest2',
        username: 'username2',
        email: 'email2',
        activities: ['1', '2', '3'],
    }
  ]
  const adminUser = {
    uid: 'adminUid',
    username: 'adminUsername',
  };

beforeEach(async () => {
    await db.collection('administradors').doc(adminUser.uid).set({'username': adminUser.username});
    for(const user of testUsers) {
        const userRef = db.collection('users').doc(user.id);
        await userRef.set(user);
    }
  });
  it('should return 200 and ban a user', async () => {
    const response = await request(app)
        .post(`/users/${testUsers[0].id}/ban`)
        .set('Authorization', `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(response.status).toBe(200);
    expect(response.text).toBe('User banned');
  });
  it('should return 401 if token is invalid', async () => {
    const response = await request(app)
        .post(`/users/${testUsers[0].id}/ban`)
        .set('Authorization', 'Bearer invalidToken');
    expect(response.status).toBe(401);
    expect(response.text).toBe('Token inválido');
  });
  it('should return 404 if user does not exist', async () => {
    const response = await request(app)
        .post(`/users/invalidId/ban`)
        .set('Authorization', `Bearer ${encrypt('invalidId').encryptedData}`);
    expect(response.status).toBe(404);
    expect(response.text).toBe('Admin no encontrado');
  });
});

describe('GET /users/banned/list', () => {
  const testUsers = [
    usertes1 = {
        id: 'useridTest1',
        username: 'username',
        email: 'email',
        activities: ['1', '2', '3'],
    },
    usertest2 = {
        id: 'useridTest2',
        username: 'username2',
        email: 'email2',
        activities: ['1', '2', '3'],
    }
  ]
  const adminUser = {
    uid: 'adminUid',
    username: 'adminUsername',
  };
  beforeEach(async () => {
      await db.collection('administradors').doc(adminUser.uid).set({'username': adminUser.username});
      for(const user of testUsers) {
          await db.collection('users').doc(user.id).set(user);
      }
    await db.collection('bannedUsers').doc('useridTest1').set(testUsers[0]);
  });
  it('should return 200 and list of banned users', async () => {
      const response = await request(app)
          .get(`/users/banned/list`)
          .set('Authorization', `Bearer ${encrypt('adminUid').encryptedData}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([testUsers[0]]);
  });
  it('should return 401 if token is invalid', async () => {
      const response = await request(app)
          .get(`/users/banned/list`)
          .set('Authorization', 'Bearer invalidToken');
      expect(response.status).toBe(401);
      expect(response.text).toBe('Token inválido');
  });
  it('should return 404 if user does not exist', async () => {
      const response = await request(app)
          .get(`/users/banned/list`)
          .set('Authorization', `Bearer ${encrypt('invalidId').encryptedData}`);
      expect(response.status).toBe(404);
      expect(response.text).toBe('Admin no encontrado');
  });
});

describe('DELETE /users/:id/unban', () => {
  const testUsers = [
    usertes1 = {
        id: 'useridTest1',
        username: 'username',
        email: 'email',
        activities: ['1', '2', '3'],
    },
    usertest2 = {
        id: 'useridTest2',
        username: 'username2',
        email: 'email2',
        activities: ['1', '2', '3'],
    }
  ]
  const adminUser = {
    uid: 'adminUid',
    username: 'adminUsername',
  };

beforeEach(async () => {
    await db.collection('administradors').doc(adminUser.uid).set({'username': adminUser.username});
    for(const user of testUsers) {
        const userRef = db.collection('users').doc(user.id);
        await userRef.set(user);
    }
    db.collection('bannedUser').doc(testUsers[0].id).set(testUsers[0]);
  });
  it('should return 200 and unban a user', async () => {
    const response = await request(app)
        .delete(`/users/${testUsers[0].id}/unban`)
        .set('Authorization', `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(response.status).toBe(200);
    expect(response.text).toBe('User unbanned');
  });
  it('should return 401 if token is invalid', async () => {
    const response = await request(app)
        .delete(`/users/${testUsers[0].id}/unban`)
        .set('Authorization', 'Bearer invalidToken');
    expect(response.status).toBe(401);
    expect(response.text).toBe('Token inválido');
  });
  it('should return 404 if user does not exist', async () => {
    const response = await request(app)
        .delete(`/users/invalidId/unban`)
        .set('Authorization', `Bearer ${encrypt('invalidId').encryptedData}`);
    expect(response.status).toBe(404);
    expect(response.text).toBe('Admin no encontrado');
  });
});
describe('DELETE /users/:id/treureRol', () => {
  const testUsers = [
    usertes1 = {
        id: 'useridTest1',
        username: 'username',
        email: 'email',
        activities: ['1', '2', '3'],
    },
    usertest2 = {
        id: 'useridTest2',
        username: 'username2',
        email: 'email2',
        activities: ['1', '2', '3'],
    }
  ]
  const adminUser = {
    uid: 'adminUid',
    username: 'adminUsername',
  };

beforeEach(async () => {
    await db.collection('administradors').doc(adminUser.uid).set({'username': adminUser.username});
    for(const user of testUsers) {
        const userRef = db.collection('users').doc(user.id);
        await userRef.set(user);
    }
    await db.collection('organitzadors').add({
      'user': 'useridTest1',
      'activitat': 1,
      'email': 'email'
    });
  });
  it('should return 200 and remove a role', async () => {
    const response = await request(app)
        .delete(`/users/${testUsers[0].id}/treureRol`)
        .set('Authorization', `Bearer ${encrypt('adminUid').encryptedData}`)
        .send({
          activitatID: 1
        });
    expect(response.status).toBe(200);
    expect(response.text).toBe('Rol eliminado');
  });
  it('should return 401 if token is invalid', async () => {
    const response = await request(app)
        .delete(`/users/${testUsers[0].id}/treureRol`)
        .set('Authorization', 'Bearer invalidToken')
        .send({
          activitatID: 1
        });
    expect(response.status).toBe(401);
    expect(response.text).toBe('Token inválido');
  });
  it('should return 404 if user does not exist', async () => {
    const response = await request(app)
        .delete(`/users/invalidId/treureRol`)
        .set('Authorization', `Bearer ${encrypt('invalidId').encryptedData}`)
        .send({
          activitatID: 1
        });
    expect(response.status).toBe(404);
    expect(response.text).toBe('Admin no encontrado');
  });
});

describe('PUT /users/:username/blockuser', () => {
  const testUsers = [
    usertes1 = {
        id: 'useridTest1',
        username: 'username',
        email: 'email',
        activities: ['1', '2', '3'],
        blockedUsers: [],
    },
    usertest2 = {
        id: 'useridTest2',
        username: 'username2',
        email: 'email2',
        activities: ['1', '2', '3'],
        blockedUsers: [],
    }
  ]
  beforeEach(async () => {
      for(const user of testUsers) {
          const userRef = db.collection('users').doc(user.id);
          await userRef.set(user);
      }
  });
  it('should return 200 and block a user', async () => {
      const response = await request(app)
          .put(`/users/${testUsers[0].username}/blockuser`)
          .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`)
          .send({ blockedUser: 'username2' });
      expect(response.status).toBe(200);
      expect(response.text).toBe('User blocked');
  });
  it('should return 401 if token is invalid', async () => {
      const response = await request(app)
          .put(`/users/${testUsers[0].username}/blockuser`)
          .set('Authorization', 'Bearer invalidToken')
          .send({ blockedUser: 'username2' });
      expect(response.status).toBe(401);
      expect(response.text).toBe('Token inválido');
  });
  it('should return 404 if user does not exist', async () => {
      const response = await request(app)
          .put(`/users/username/blockuser`)
          .set('Authorization', `Bearer ${encrypt('useridTest12').encryptedData}`)
          .send({ blockedUser: 'username2' });
      expect(response.status).toBe(404);
      expect(response.text).toBe('Usuario que envió la solicitud no encontrado');
  });
  it('should return 404 if blocked user does not exist', async () => {
      const response = await request(app)
          .put(`/users/${testUsers[0].username}/blockuser`)
          .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`)
          .send({ blockedUser: 'invalidUsername' });
      expect(response.status).toBe(404);
      expect(response.text).toBe('Blocked user not found');
  });
})
describe('PUT /users/:username/unblockuser', () => {
  const testUsers = [
    usertes1 = {
        id: 'useridTest1',
        username: 'username',
        email: 'email',
        activities: ['1', '2', '3'],
        blockedUsers: ['useridTest2']
    },
    usertest2 = {
        id: 'useridTest2',
        username: 'username2',
        email: 'email2',
        activities: ['1', '2', '3'],
        blockedUsers: ['useridTest2'],
    }
  ]
  beforeEach(async () => {
      for(const user of testUsers) {
          const userRef = db.collection('users').doc(user.id);
          await userRef.set(user);
      }
  });
  it('should return 200 and unblock a user', async () => {
      const response = await request(app)
          .put(`/users/${testUsers[0].username}/unblockuser`)
          .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`)
          .send({ blockedUser: 'username2' });
      expect(response.status).toBe(200);
      expect(response.text).toBe('User unblocked');
  });
  it('should return 401 if token is invalid', async () => {
      const response = await request(app)
          .put(`/users/${testUsers[0].username}/unblockuser`)
          .set('Authorization', 'Bearer invalidToken')
          .send({ blockedUser: 'username2' });
      expect(response.status).toBe(401);
      expect(response.text).toBe('Token inválido');
  });
  it('should return 404 if user does not exist', async () => {
      const response = await request(app)
          .put(`/users/uername/unblockuser`)
          .set('Authorization', `Bearer ${encrypt('useridTest12').encryptedData}`)
          .send({ blockedUser: 'username2' });
      expect(response.status).toBe(404);
      expect(response.text).toBe('Usuario que envió la solicitud no encontrado');
  });
  it('should return 404 if blocked user does not exist', async () => {
      const response = await request(app)
          .put(`/users/${testUsers[0].username}/unblockuser`)
          .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`)
          .send({ blockedUser: 'invalidUsername' });
      expect(response.status).toBe(404);
      expect(response.text).toBe('Blocked user not found');
  });
});
describe('GET /users/:username/blockedusers', () => {
  const testUsers = [
    usertes1 = {
        id: 'useridTest1',
        username: 'username',
        email: 'email',
        activities: ['1', '2', '3'],
        blockedUsers: ['useridTest2']
    },
    usertest2 = {
        id: 'useridTest2',
        username: 'username2',
        email: 'email2',
        activities: ['1', '2', '3'],
        blockedUsers: ['useridTest2'],
    }
  ]
  beforeEach(async () => {
      for(const user of testUsers) {
          const userRef = db.collection('users').doc(user.id);
          await userRef.set(user);
      }
  });
  it('should return 200 and list of blocked users', async () => {
      const response = await request(app)
          .get(`/users/${testUsers[0].username}/blockedusers`)
          .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(["username2"]);
  });
  it('should return 401 if token is invalid', async () => {
      const response = await request(app)
          .get(`/users/${testUsers[0].username}/blockedusers`)
          .set('Authorization', 'Bearer invalidToken');
      expect(response.status).toBe(401);
      expect(response.text).toBe('Token inválido');
  });
  it('should return 404 if user does not exist', async () => {
      const response = await request(app)
          .get(`/users/username/blockedusers`)
          .set('Authorization', `Bearer ${encrypt('useridTest13').encryptedData}`);
      expect(response.status).toBe(404);
      expect(response.text).toBe('Usuario que envió la solicitud no encontrado');
  });
});