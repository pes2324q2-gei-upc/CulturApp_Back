
const request = require('supertest');
const app = require('../app'); 

describe('POST /tickets/create/reportUsuari', () => {
  it('should create a user report', async () => {
    const res = await request(app)
      .post('/tickets/create/reportUsuari')
      .send({
        uid: 'testUid',
        report: 'testReport',
        usuariReportat: 'testUsuariReportat',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('OK');

    const docs = await db.collection('reportsUsuaris').where('user', '==', 'testUid').get();
    expect(docs.empty).toBeFalsy();
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




//Crear indice de ordenación en la base de datos porque si no lo devuelve como le da la gana