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

describe('GET /insignies/user/:username',() => {
    const users = [
        users1 = {
            'username': 'user1',
        },
        users2 = {
            'username': 'user2',
        }
    ]
    const insignies = [ {
        'fam': ['o', 0], //infantil, fires-i-mercats
        'virtual': ['p', 0], //activitats-virtuals, cultura-digital
        'arte': ['b', 10], //exposicions
        'comem': ['b', 0], //commemoracions
        'carnaval': ['None', 0], //carnavals
        'circ': ['None', 0], //circ
        'concert': ['None', 0], //concerts
        'confe': ['None', 0], //conferencies
        'edu': ['None', 0], //cicles, cursos
        'festa': ['None', 0], // festes, festaivals-i-mostres, dansa, gegants
        'rec': ['None', 0], // catsAMB
        'ruta': ['None', 0], //rutes-i-visites
        'teatre': ['None', 0], //teatre
    }];
    beforeEach(async () => {
        for (let i = 0; i < users.length; i++) {
            let username = users[i].username;
            await db.collection('users').doc(username).set(users[i]);
            await db.collection('insignies').doc(username).set({
                'circ': ['None', 0], //circ
                'festa': ['None', 0], // festes, festaivals-i-mostres, dansa, gegants
                'teatre': ['None', 0], //teatre
                'rec': ['None', 0], // catsAMB
                'carnaval': ['None', 0], //carnavals
                'concert': ['None', 0], //concerts
                'arte': ['b', 10], //exposicions
                'confe': ['None', 0], //conferencies
                'comem': ['b', 0], //commemoracions
                'ruta': ['None', 0], //rutes-i-visites
                'edu': ['None', 0], //cicles, cursos
                'virtual': ['p', 0], //activitats-virtuals, cultura-digital
                'fam': ['o', 0], //infantil, fires-i-mercats
            });
        }
    });
    it('should return the insignies of the user', async () => {
        const res = await request(app)
        .get('/insignies/user/user1')
        .set('Authorization', 'Bearer ' + encrypt('user1').encryptedData);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(insignies[0]);
    });
    it('should return 401 if the user is not authenticated', async () => {
        const res = await request(app)
        .get('/insignies/user/user1')
        .set('Authorization', 'Bearer encryptedData');
        expect(res.statusCode).toEqual(401);
    });
    it('should return 404 if the user does not exist', async () => {
        const res = await request(app)
        .get('/insignies/user/user3')
        .set('Authorization', 'Bearer ' + encrypt('user3').encryptedData);
        expect(res.statusCode).toEqual(404);
    });
})