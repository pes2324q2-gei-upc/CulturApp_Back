
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

    it('deberia enviar 400 porque faltan atributos', async () => {

      for (const usuari of testUsers) {
        await db.collection('usuaris').doc(usuari.uid).set({"username": usuari.username});
      }

      const res = await request(app)
      .post('/tickets/create/reportUsuari')
      .send({
        token: encrypt('testUid1').encryptedData,
        titol: 'testTitol',
        usuariReportat: 'testUsername2',
        
      });

      expect(res.statusCode).toEqual(400);
      expect(res.text).toBe('Faltan atributos');
    });

    it('deberia crear un reporte de usuario', async () => {

      for (const usuari of testUsers) {
        await db.collection('usuaris').doc(usuari.uid).set({"username": usuari.username});
      }

      const res = await request(app)
        .post('/tickets/create/reportUsuari')
        .send({
          token: encrypt('testUid1').encryptedData,
          titol: 'tittoltest',
          usuariReportat: 'testUsername2',
          report: 'testReport',
        });
  
      expect(res.statusCode).toEqual(200);
      expect(res.text).toBe('OK');
  
      const docs = await db.collection('reportsUsuaris').where('user', '==', 'testUid1').get();
      expect(docs.empty).toBeFalsy();
    });

    it("deberia enviar un 401 porque el token no es valido", async () => {
     
      for (const usuari of testUsers) {
        await db.collection('usuaris').doc(usuari.uid).set({"username": usuari.username});
      }

      const res = await request(app)
        .post('/tickets/create/reportUsuari')
        .send({
          token: 'testUid1',
          report: 'testReport',
          usuariReportat: 'testUsername2',
        });
  
      expect(res.statusCode).toEqual(401);
      expect(res.text).toBe('El token no valido');
    });

    it("deberia enviar un 404 porque el token enviado no pertenece a ningun usuario", async () => {
      
      for (const usuari of testUsers) {
        await db.collection('usuaris').doc(usuari.uid).set({"username": usuari.username});
      }

      const res = await request(app)
        .post('/tickets/create/reportUsuari')
        .send({
          token: encrypt('testUid3').encryptedData,
          titol: 'tittoltest',
          usuariReportat: 'testUsername2',
          report: 'testReport',

        });
  
      expect(res.statusCode).toEqual(404);
      expect(res.text).toBe('Usuario reportador no encontrado');
    });

    it("deberia enviar un 404 porque el username enviado no pertenece a ningun usuario", async () => {
     
      for (const usuari of testUsers) {
        await db.collection('usuaris').doc(usuari.uid).set({"username": usuari.username});
      }

      const res = await request(app)
        .post('/tickets/create/reportUsuari')
        .send({
          token: encrypt('testUid1').encryptedData,
          titol: 'tittoltest',
          usuariReportat: 'testUsername3',
          report: 'testReport',
        });
  
      expect(res.statusCode).toEqual(404);
      expect(res.text).toBe('Usuario reportado no encontrado');
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

describe('GET /tickets/reportsUsuari/:id', () => {
  it('deberia devolver un ticket', async () => {
    // Add a test report to the database
    const testReport = {
      uid: 'testUid',
      report: 'testReport',
      usuariReportat: 'testUsuariReportat',
      solucionat: false,
      administrador: '',
    };

    await db.collection('reportsUsuaris').add(testReport);

    const res = await request(app).get(`/tickets/reportsUsuari/${testReport.uid}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(testReport);
  });

  it('should return 404 if the report does not exist', async () => {
    const res = await request(app).get('/tickets/reportsUsuari/doesNotExist');

    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Reporte no encontrado');
  });
});



