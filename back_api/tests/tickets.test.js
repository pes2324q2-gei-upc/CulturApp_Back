
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
//tests reportes de usuario
describe('POST /tickets/reportUsuari/create', () => {
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
  beforeEach(async () => {
    for (const usuari of testUsers) {
        await db.collection('usuaris').doc(usuari.uid).set({"username": usuari.username});
      }    
  });

    it('deberia enviar 400 porque faltan atributos', async () => {

      const res = await request(app)
      .post('/tickets/reportUsuari/create')
      .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`)
      .send({
        titol: 'testTitol',
        usuariReportat: 'testUsername2',
      });

      expect(res.statusCode).toEqual(400);
      expect(res.text).toBe('Faltan atributos');
    });

    
    it('deberia crear un reporte de usuario', async () => {

    

      const res = await request(app)
        .post('/tickets/reportUsuari/create')
        .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`)
        .send({
          titol: 'tittoltest',
          usuariReportat: 'testUsername2',
          report: 'testReport',
        });
  
      expect(res.statusCode).toEqual(200);
      expect(res.text).toBe('report afegit');
  
      const docs = await db.collection('reportsUsuaris').where('user', '==', 'testUid1').get();
      expect(docs.empty).toBeFalsy();
    });

    it("deberia enviar un 401 porque el token no es valido", async () => {
     
      const res = await request(app)
        .post('/tickets/reportUsuari/create')
        .set('Authorization',  'Bearer testUid1')
        .send({
          report: 'testReport',
          usuariReportat: 'testUsername2',
        });
  
      expect(res.statusCode).toEqual(401);
      expect(res.text).toBe('Token inválido');
    });

    it("deberia enviar un 404 porque el token enviado no pertenece a ningun usuario", async () => {
      
      const res = await request(app)
        .post('/tickets/reportUsuari/create')
        .set('Authorization',  `Bearer ${encrypt('testUid3').encryptedData}`)
        .send({
          titol: 'tittoltest',
          usuariReportat: 'testUsername2',
          report: 'testReport',

        });
  
      expect(res.statusCode).toEqual(404);
      expect(res.text).toBe('Usuario que envio la solicitud no encontrado');
    });

    it("deberia enviar un 404 porque el username enviado no pertenece a ningun usuario", async () => {

      const res = await request(app)
        .post('/tickets/reportUsuari/create')
        .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`)
        .send({
          titol: 'tittoltest',
          usuariReportat: 'testUsername3',
          report: 'testReport',
        });
  
      expect(res.statusCode).toEqual(404);
      expect(res.text).toBe('Usuario reportado no encontrado');
    });

});

describe('GET /tickets/reportsUsuari/all', () => {
  const testReports = [
    {
      id: 'testUid1',
      report: 'testReport1',
      titol: 'testTitol1',
      usuariReportat: 'testUsuariReportat1',
      solucionat: false,
      administrador: '',
      data_report: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      report: 'testReport2',
      usuariReportat: 'testUsuariReportat2',
      solucionat: false,
      administrador: '',
      data_report: new Date().toISOString(),
    },
  ];
  beforeEach(async () => {
    const adminUser = {
      uid: 'adminUid',
      username: 'adminUsername',
    };
    // Then add the admin user to the 'admin' collection
    await db.collection('administradors').doc(adminUser.uid).set({'username': adminUser.username});
    for (const report of testReports) {
      await db.collection('reportsUsuaris').doc(report.id).set({
        'titol': report.titol,
        'report': report.report,
        'usuariReportat': report.usuariReportat,
        'solucionat': report.solucionat,
        'administrador': report.administrador,
        'data_report': report.data_report,
      });
    }
  });
  it('should return all user reports', async () => {
    // Add test reports to the database
  
    const res = await request(app)
    .get('/tickets/reportsUsuaris/all')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(testReports.length);

    for (const report of testReports) {
      expect(res.body).toContainEqual(report);
    }
  });

  it('should return 404 if the user is not an admin', async () => {
    const res = await request(app)
    .get('/tickets/reportsUsuaris/all')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });

});

describe('GET /tickets/reportsUsuari/:id', () => {
  const testReports = [
    {
      id: 'testUid1',
      report: 'testReport1',
      titol: 'testTitol1',
      usuariReportat: 'testUsuariReportat1',
      solucionat: false,
      administrador: '',
      data_report: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      report: 'testReport2',
      usuariReportat: 'testUsuariReportat2',
      solucionat: false,
      administrador: '',
      data_report: new Date().toISOString(),
    },
  ];
  beforeEach(async () => {
    const adminUser = {
      uid: 'adminUid',
      username: 'adminUsername',
    };
    // Then add the admin user to the 'admin' collection
    await db.collection('administradors').doc(adminUser.uid).set({'username': adminUser.username});
    for (const report of testReports) {
      await db.collection('reportsUsuaris').doc(report.id).set({
        'titol': report.titol,
        'report': report.report,
        'usuariReportat': report.usuariReportat,
        'solucionat': report.solucionat,
        'administrador': report.administrador,
        'data_report': report.data_report,
      });
    }
  });
  it('deberia devolver un ticket', async () => {
    // Add a test report to the database
    const res = await request(app)
    .get('/tickets/reportsUsuari/testUid1')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`)

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(testReports[0]);
  });

  it('should return 404 if the report does not exist', async () => {
    const res = await request(app).
    get('/tickets/reportsUsuari/doesNotExist')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`)

    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Reporte no encontrado');
  });
});

describe('PUT /tickets/reportsUsuari/:id/solucionar', () => {
  const testReports = [
    {
      id: 'testUid1',
      report: 'testReport1',
      titol: 'testTitol1',
      usuariReportat: 'testUsuariReportat1',
      solucionat: false,
      administrador: '',
      data_report: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      report: 'testReport2',
      usuariReportat: 'testUsuariReportat2',
      solucionat: false,
      administrador: '',
      data_report: new Date().toISOString(),
    },
  ];
  const adminUser = {
    uid: 'adminUid',
    username: 'adminUsername',
  };
  beforeEach(async () => {
    await db.collection('administradors').doc(adminUser.uid).set({'username': adminUser.username});
    for (const report of testReports) {
      await db.collection('reportsUsuaris').doc(report.id).set({
        'titol': report.titol,
        'report': report.report,
        'usuariReportat': report.usuariReportat,
        'solucionat': report.solucionat,
        'administrador': report.administrador,
        'data_report': report.data_report,
      });
    }
  });
  it('deberia solucionar un reporte', async () => {
    
    const res = await request(app)
    .put('/tickets/reportsUsuari/testUid1/solucionar')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('report usauri solucionat');
  });
  it('deberia devolver 404 si el reporte no existe', async () => {
    const res = await request(app)
    .put('/tickets/reportsUsuari/doesNotExist/solucionar')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Reporte no encontrado');
  });
});

