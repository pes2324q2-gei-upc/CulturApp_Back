
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
        for(const user of testUsers) {
            const userRef = db.collection('users').doc(user.id);
            await userRef.set(user);
        }
    });
    it('should return 200 and user data', async () => {
        const user = testUsers[0];
        const response = await request(app)
            .get(`/users/info`)
            .set('Authorization', `Bearer ${user.id}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(user);
    });
    it('should return 404 if user does not exist', async () => {
        const response = await request(app)
            .get(`/users/info`)
            .set('Authorization', `Bearer ${'invaldId'}`);
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
        expect(response.text).toBe('Usuario que envió la solicitud no encontrado');
    });
});
describe('GET /users/:id/activitats', () => {
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
            .get(`/users/${user.id}/activitats`)
            .set('Authorization', `Bearer ${encrypt(user.id).encryptedData}`);
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