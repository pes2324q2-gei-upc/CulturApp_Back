
const request = require('supertest');
const app = require('../app'); 

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}


describe('POST /tickets/create/reportUsuari', () => {
  const testUsers = [
    {
      uid: 'testUid1',
      username: 'testUsername1',
    },
    {
      uid: 'testUid2',
      username: 'testUsername2',
    },
  ];

    it('should create a user report', async () => {

      for (const usuari of testUsers) {
        await db.collection('usuaris').add(usuari);
      }

      const res = await request(app)
        .post('/tickets/create/reportUsuari')
        .send({
          uid: encrypt('testUid1'),
          report: 'testReport',
          usuariReportat: 'testUsername2',
        });
  
      expect(res.statusCode).toEqual(200);
      expect(res.text).toBe('OK');
  
      const docs = await db.collection('reportsUsuaris').where('user', '==', 'testUid1').get();
      expect(docs.empty).toBeFalsy();
    });

    it("should send 404 code when the user reporting doesn't exist", async () => {
      for (const usuari of testUsers) {
        await db.collection('usuaris').add(usuari);
      }

      const res = await request(app)
        .post('/tickets/create/reportUsuari')
        .send({
          uid: 'testUid1',
          report: 'testReport',
          usuariReportat: 'testUsername2',
        });
  
      expect(res.statusCode).toEqual(404);
      expect(res.text).toBe('Usuari no trobat');
    });

    it("should send 404 code when the user reported doesn't exist", async () => {
      for (const usuari of testUsers) {
        await db.collection('usuaris').add(usuari);
      }

      const res = await request(app)
        .post('/tickets/create/reportUsuari')
        .send({
          uid: 'testUid1',
          report: 'testReport',
          usuariReportat: 'testUsername3',
        });
  
      expect(res.statusCode).toEqual(404);
      expect(res.text).toBe('Usuari reportat no trobat');
    });
});

describe('GET /tickets/read/reportsUsuari/all', () => {
  it('should return all user reports', async () => {
    // Add test reports to the database
    const testReports = [
      {
        uid: 'testUid1',
        report: 'testReport1',
        usuariReportat: 'testUsuariReportat1',
        solucionat: false,
        administrador: '',
      },
      {
        uid: 'testUid2',
        report: 'testReport2',
        usuariReportat: 'testUsuariReportat2',
        solucionat: false,
        administrador: '',
      },
    ];

    for (const report of testReports) {
      await db.collection('reportsUsuaris').add(report);
    }

    const res = await request(app).get('/tickets/read/reportsUsuari/all');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(testReports.length);

    for (const report of testReports) {
      expect(res.body).toContainEqual(report);
    }
  });
});





