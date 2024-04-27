
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
        await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
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
    expect(res.text).toBe('report usuari solucionat');
  });
  it('deberia devolver 404 si el reporte no existe', async () => {
    const res = await request(app)
    .put('/tickets/reportsUsuari/doesNotExist/solucionar')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Reporte no encontrado');
  });
});
describe('GET /tickets/reportsUsuari/pendent', () => {
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
  it ('deberia devolver todos los reportes pendientes', async () => {
    const res = await request(app)
    .get('/tickets/reportsUsuaris/pendents')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(testReports.length);
  });
  it ('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .get('/tickets/reportsUsuaris/pendents')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });
});
describe('GET /tickets/reportsUsuari/done', () => {
  const testReports = [
    {
      id: 'testUid1',
      report: 'testReport1',
      titol: 'testTitol1',
      usuariReportat: 'testUsuariReportat1',
      solucionat: true,
      administrador: '',
      data_report: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      report: 'testReport2',
      usuariReportat: 'testUsuariReportat2',
      solucionat: true,
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
  it ('deberia devolver todos los reportes solucionados', async () => {
    const res = await request(app)
    .get('/tickets/reportsUsuaris/done')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(testReports.length);
  });
  
  it('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .get('/tickets/reportsUsuaris/done')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
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
  it('deberia devolver 404 si el reporte no existe', async () => {
    const res = await request(app)
    .put('/tickets/reportsUsuari/doesNotExist/solucionar')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Reporte no encontrado');
  });
  it('deberia solucionar un reporte', async () => {
    const res = await request(app)
    .put('/tickets/reportsUsuari/testUid1/solucionar')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('report usuari solucionat');
  });
  it('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .put('/tickets/reportsUsuari/testUid1/solucionar')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });
});
describe('PUT /tickets/reportsUsuari/:id/nosolucionar', () => {
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
  it('deberia devolver 404 si el reporte no existe', async () => {
    const res = await request(app)
    .put('/tickets/reportsUsuari/doesNotExist/nosolucionar')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Reporte no encontrado');
  });
  it('deberia marcar un reporte como no solucionado', async () => {
    const res = await request(app)
    .put('/tickets/reportsUsuari/testUid1/nosolucionar')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('report usuari no solucionat');
  });
  it('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .put('/tickets/reportsUsuari/testUid1/nosolucionar')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });
});
describe('DELETE /tickets/reportsUsuari/:id/delete', () => {
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
  it('deberia devolver 404 si el reporte no existe', async () => {
    const res = await request(app)
    .delete('/tickets/reportsUsuari/doesNotExist/delete')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Reporte no encontrado');
  });
  it('deberia eliminar un reporte', async () => {
    const res = await request(app)
    .delete('/tickets/reportsUsuari/testUid1/delete')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('report usuari eliminat');
  });
  it('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .delete('/tickets/reportsUsuari/testUid1/delete')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });
});

//Tests reports bugs
describe ('POST /tickets/reportBug/create', () => {
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
        await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
      }    
  });
  it('deberia enviar 400 porque faltan atributos', async () => {
    const res = await request(app)
    .post('/tickets/reportBug/create')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`)
    .send({
      titol: 'testTitol',
    });
    expect(res.statusCode).toEqual(400);
    expect(res.text).toBe('Faltan atributos');
  });
  it('deberia crear un reporte de bug', async () => {
    const res = await request(app)
    .post('/tickets/reportBug/create')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`)
    .send({
      titol: 'testTitol',
      report: 'testDescripcio',
    });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('Report de bug creat');
  });
  it('deberia devolver 401 si el token no es valido', async () => {
    const res = await request(app)
    .post('/tickets/reportBug/create')
    .set('Authorization',  'Bearer testUid1')
    .send({
      titol: 'testTitol',
      report: 'testDescripcio',
    });
    expect(res.statusCode).toEqual(401);
    expect(res.text).toBe('Token inválido');
  });
  it('deberia devolver 404 si el usuario no existe', async () => {
    const res = await request(app)
    .post('/tickets/reportBug/create')
    .set('Authorization',  `Bearer ${encrypt('testUid3').encryptedData}`)
    .send({
      titol: 'testTitol',
      report: 'testDescripcio',
    });
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Usuario que envio la solicitud no encontrado');
  });
});
describe('GET /tickets/reportsBug/all', () => {
  const testReports = [
    {
      id: 'testUid1',
      report: 'testReport1',
      titol: 'testTitol1',
      solucionat: false,
      administrador: '',
      data_report: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      report: 'testReport2',
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
      await db.collection('reportsBugs').doc(report.id).set({
        'titol': report.titol,
        'report': report.report,
        'solucionat': report.solucionat,
        'administrador': report.administrador,
        'data_report': report.data_report,
      });
    }
  });
  it('deberia devolver todos los reportes de bug', async () => {
    const res = await request(app)
    .get('/tickets/reportsBug/all')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(testReports.length);
  });
  it('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .get('/tickets/reportsBug/all')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });
});
describe('GET /tickets/reportsBug/:id', () => {
  const testReports = [
    {
      id: 'testUid1',
      report: 'testReport1',
      titol: 'testTitol1',
      solucionat: false,
      administrador: '',
      data_report: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      report: 'testReport2',
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
      await db.collection('reportsBugs').doc(report.id).set({
        'titol': report.titol,
        'report': report.report,
        'solucionat': report.solucionat,
        'administrador': report.administrador,
        'data_report': report.data_report,
      });
    }
  });
  it('deberia devolver un reporte de bug', async () => {
    const res = await request(app)
    .get('/tickets/reportsBug/testUid1')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(testReports[0]);
  });
  it('deberia devolver 404 si el reporte no existe', async () => {
    const res = await request(app)
    .get('/tickets/reportsBug/doesNotExist')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Reporte no encontrado');
  });
});
describe('GET /tickets/reportsBug/pendent', () => {
  const testReports = [
    {
      id: 'testUid1',
      report: 'testReport1',
      titol: 'testTitol1',
      solucionat: false,
      administrador: '',
      data_report: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      report: 'testReport2',
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
      await db.collection('reportsBugs').doc(report.id).set({
        'titol': report.titol,
        'report': report.report,
        'solucionat': report.solucionat,
        'administrador': report.administrador,
        'data_report': report.data_report,
      });
    }
  });
  it('deberia devolver todos los reportes pendientes', async () => {
    const res = await request(app)
    .get('/tickets/reportsBugs/pendents')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(testReports.length);
  });
  it('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .get('/tickets/reportsBugs/pendents')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });
});
describe('GET /tickets/reportsBug/done', () => {
  const testReports = [
    {
      id: 'testUid1',
      report: 'testReport1',
      titol: 'testTitol1',
      solucionat: true,
      administrador: '',
      data_report: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      report: 'testReport2',
      solucionat: true,
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
      await db.collection('reportsBugs').doc(report.id).set({
        'titol': report.titol,
        'report': report.report,
        'solucionat': report.solucionat,
        'administrador': report.administrador,
        'data_report': report.data_report,
      })
    }
  });
  it('deberia devolver todos los reportes solucionados', async () => {
    const res = await request(app)
    .get('/tickets/reportsBugs/done')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(testReports.length);
  });
  it('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .get('/tickets/reportsBugs/done')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });
});
describe('PUT /tickets/reportsBug/:id/solucionar', () => {
  const testReports = [
    {
      id: 'testUid1',
      report: 'testReport1',
      titol: 'testTitol1',
      solucionat: false,
      administrador: '',
      data_report: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      report: 'testReport2',
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
      await db.collection('reportsBugs').doc(report.id).set({
        'titol': report.titol,
        'report': report.report,
        'solucionat': report.solucionat,
        'administrador': report.administrador,
        'data_report': report.data_report,
      })
    }
  });
  it('deberia devolver 404 si el reporte no existe', async () => {
    const res = await request(app)
    .put('/tickets/reportsBug/doesNotExist/solucionar')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Reporte no encontrado');
  });
  it('deberia solucionar un reporte', async () => {
    const res = await request(app)
    .put('/tickets/reportsBug/testUid1/solucionar')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('Bug reportado solucionado');
  });
  it('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .put('/tickets/reportsBug/testUid1/solucionar')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });
});
describe('PUT /tickets/reportsBug/:id/nosolucionar', () => {
  const testReports = [
    {
      id: 'testUid1',
      report: 'testReport1',
      titol: 'testTitol1',
      solucionat: true,
      administrador: '',
      data_report: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      report: 'testReport2',
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
      await db.collection('reportsBugs').doc(report.id).set({
        'titol': report.titol,
        'report': report.report,
        'solucionat': report.solucionat,
        'administrador': report.administrador,
        'data_report': report.data_report,
      })
    }
  });
  it('deberia devolver 404 si el reporte no existe', async () => {
    const res = await request(app)
    .put('/tickets/reportsBug/doesNotExist/nosolucionar')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Reporte no encontrado');
  });
  it('deberia marcar un reporte como no solucionado', async () => {
    const res = await request(app)
    .put('/tickets/reportsBug/testUid1/nosolucionar')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('Bug reportado no solucionado');
  });
  it('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .put('/tickets/reportsBug/testUid1/nosolucionar')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });
});
describe('DELETE /tickets/reportsBug/:id/delete', () => {
  const testReports = [
    {
      id: 'testUid1',
      report: 'testReport1',
      titol: 'testTitol1',
      solucionat: true,
      administrador: '',
      data_report: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      report: 'testReport2',
      solucionat: true,
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
      await db.collection('reportsBugs').doc(report.id).set({
        'titol': report.titol,
        'report': report.report,
        'solucionat': report.solucionat,
        'administrador': report.administrador,
        'data_report': report.data_report,
      })
    }
  });
  it('deberia devolver 404 si el reporte no existe', async () => {
    const res = await request(app)
    .delete('/tickets/reportsBug/doesNotExist/delete')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Reporte no encontrado');
  });
  it('deberia eliminar un reporte', async () => {
    const res = await request(app)
    .delete('/tickets/reportsBug/testUid1/delete')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('report bug eliminat');
  });
});

//Test sol·licituds d'organitzadors
describe('POST /tickets/solicitudsOrganitzador/create', () => {
  const testUsers = [
    {
      uid: 'testUid1',
      username: 'testUsername1',
      email: 'testEmail1',
    },
    {
      uid: 'testUid2',
      username: 'testUsername2',
      email: 'testEmail2',
    },
  ];
  beforeEach(async () => {
    for (const usuari of testUsers) {
        await db.collection('users').doc(usuari.uid).set({"username": usuari.username, "email": usuari.email});
      }    
      await db.collection('actividades').doc('testIdActivitat').set({
        'titol': 'testTitol',
        'descripcio': 'testDescripcio',
        'data': new Date().toISOString(),
        'hora': 'testHora',
      });
  });
  it('deberia enviar 400 porque faltan atributos', async () => {
    const res = await request(app)
    .post('/tickets/solicitudsOrganitzador/create')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`)
    .send({
      titol: 'testTitol',
    });
    expect(res.statusCode).toEqual(400);
    expect(res.text).toBe('Faltan atributos');
  });
  it('deberia crear una solicitud de organizador', async () => {
    const res = await request(app)
    .post('/tickets/solicitudsOrganitzador/create')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`)
    .send({
      titol: 'testTitol',
      idActivitat: 'testIdActivitat',
      motiu: 'testDescripcio',
    });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('Solicitud de organizador creada');
  });
  it('deberia devolver 401 si el token no es valido', async () => {
    const res = await request(app)
    .post('/tickets/solicitudsOrganitzador/create')
    .set('Authorization',  'Bearer testUid1')
    .send({
      titol: 'testTitol',
      idActivitat: 'testIdActivitat',
      motiu: 'testDescripcio',
    });
    expect(res.statusCode).toEqual(401);
    expect(res.text).toBe('Token inválido');
  });
  it('deberia devolver 404 si el usuario no existe', async () => {
    const res = await request(app)
    .post('/tickets/solicitudsOrganitzador/create')
    .set('Authorization',  `Bearer ${encrypt('testUid3').encryptedData}`)
    .send({
      titol: 'testTitol',
      idActivitat: 'testIdActivitat',
      motiu: 'testDescripcio',
    });
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Usuario que envio la solicitud no encontrado');
  });
});
describe('GET /tickets/solicitudsOrganitzador/all', () => {
  const testSolicituds = [
    {
      id: 'testUid1',
      report: 'testReport1',
      titol: 'testTitol1',
      idActivitat: 'testIdActivitat',
      pendent:true,
      solucionat: false,
      administrador: '',
      data_sol: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      report: 'testReport2',
      idActivitat: 'testIdActivitat',
      solucionat: true,
      pendent: false,
      administrador: '',
      data_sol: new Date().toISOString(),
    },
  ];
  const adminUser = {
    uid: 'adminUid',
    username: 'adminUsername',
  };
  beforeEach(async () => {
    await db.collection('administradors').doc(adminUser.uid).set({'username': adminUser.username});
    for (const solicitud of testSolicituds) {
      await db.collection('solicitudsOrganitzador').doc(solicitud.id).set({
        'titol': solicitud.titol,
        'motiu': solicitud.report,
        'solucionat': solicitud.solucionat,
        'idActivitat': solicitud.idActivitat,
        'pendent': solicitud.pendent,
        'administrador': solicitud.administrador,
        'data_sol': solicitud.data_sol,
      })
    }
  });
  it('deberia devolver todas las solicitudes de organizador', async () => {
    const res = await request(app)
    .get('/tickets/solicitudsOrganitzador/all')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(testSolicituds.length);
  });
  it('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .get('/tickets/solicitudsOrganitzador/all')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });
});
describe('GET /tickets/solicitudsOrganitzador/:id', () => {
  const testSolicituds = [
    {
      id: 'testUid1',
      motiu: 'testReport1',
      titol: 'testTitol1',
      idActivitat: 'testIdActivitat',
      pendent:true,
      solucionat: false,
      administrador: '',
      data_sol: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      motiu: 'testReport2',
      idActivitat: 'testIdActivitat',
      solucionat: true,
      pendent: false,
      administrador: '',
      data_sol: new Date().toISOString(),
    },
  ];
  const adminUser = {
    uid: 'adminUid',
    username: 'adminUsername',
  };
  beforeEach(async () => {
    await db.collection('administradors').doc(adminUser.uid).set({'username': adminUser.username});
    for (const solicitud of testSolicituds) {
      await db.collection('solicitudsOrganitzador').doc(solicitud.id).set({
        'titol': solicitud.titol,
        'motiu': solicitud.motiu,
        'solucionat': solicitud.solucionat,
        'idActivitat': solicitud.idActivitat,
        'pendent': solicitud.pendent,
        'administrador': solicitud.administrador,
        'data_sol': solicitud.data_sol,
      })
    }
  });
  it('deberia devolver una solicitud de organizador', async () => {
    const res = await request(app)
    .get('/tickets/solicitudsOrganitzador/testUid1')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(testSolicituds[0]);
  });
  it('deberia devolver 404 si la solicitud no existe', async () => {
    const res = await request(app)
    .get('/tickets/solicitudsOrganitzador/doesNotExist')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Solicitud no encontrada');
  });
});
describe('GET /tickets/solicitudsOrganitzador/pendent', () => {
  const testSolicituds = [
    {
      id: 'testUid1',
      motiu: 'testReport1',
      titol: 'testTitol1',
      idActivitat: 'testIdActivitat',
      pendent:true,
      solucionat: false,
      administrador: '',
      data_sol: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      motiu: 'testReport2',
      idActivitat: 'testIdActivitat',
      solucionat: true,
      pendent: false,
      administrador: '',
      data_sol: new Date().toISOString(),
    },
  ];
  const adminUser = {
    uid: 'adminUid',
    username: 'adminUsername',
  };
  beforeEach(async () => {
    await db.collection('administradors').doc(adminUser.uid).set({'username': adminUser.username});
    for (const solicitud of testSolicituds) {
      await db.collection('solicitudsOrganitzador').doc(solicitud.id).set({
        'titol': solicitud.titol,
        'motiu': solicitud.motiu,
        'solucionat': solicitud.solucionat,
        'idActivitat': solicitud.idActivitat,
        'pendent': solicitud.pendent,
        'administrador': solicitud.administrador,
        'data_sol': solicitud.data_sol,
      })
    }
  });
  it('deberia devolver todas las solicitudes pendientes', async () => {
    const res = await request(app)
    .get('/tickets/solicitudsOrganitzador/pendents')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(1);
  });
  it('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .get('/tickets/solicitudsOrganitzador/pendents')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });
});
describe('GET /tickets/solicitudsOrganitzador/done', () => {
  const testSolicituds = [
    {
      id: 'testUid1',
      motiu: 'testReport1',
      titol: 'testTitol1',
      idActivitat: 'testIdActivitat',
      pendent:true,
      atorgat: false,
      administrador: '',
      data_sol: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      motiu: 'testReport2',
      idActivitat: 'testIdActivitat',
      atorgat: true,
      pendent: false,
      administrador: '',
      data_sol: new Date().toISOString(),
    },
  ];
  const adminUser = {
    uid: 'adminUid',
    username: 'adminUsername',
  };
  beforeEach(async () => {
    await db.collection('administradors').doc(adminUser.uid).set({'username': adminUser.username});
    for (const solicitud of testSolicituds) {
      await db.collection('solicitudsOrganitzador').doc(solicitud.id).set({
        'titol': solicitud.titol,
        'motiu': solicitud.motiu,
        'atorgat': solicitud.atorgat,
        'idActivitat': solicitud.idActivitat,
        'pendent': solicitud.pendent,
        'administrador': solicitud.administrador,
        'data_sol': solicitud.data_sol,
      })
    }
  });
  it('deberia devolver todas las solicitudes solucionadas', async () => {
    const res = await request(app)
    .get('/tickets/solicitudsOrganitzador/acceptades')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(1);
  });
  it('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .get('/tickets/solicitudsOrganitzador/acceptades')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });
});
describe('PUT /tickets/solicitudsOrganitzador/:id/acceptar', () => {
  const testSolicituds = [
    {
      id: 'testUid1',
      motiu: 'testReport1',
      titol: 'testTitol1',
      idActivitat: 'testIdActivitat',
      pendent:true,
      atorgat: false,
      administrador: '',
      data_sol: new Date().toISOString(),
    },
    {
      id: 'testUid2',
      titol: 'testTitol2',
      motiu: 'testReport2',
      idActivitat: 'testIdActivitat',
      atorgat: true,
      pendent: false,
      administrador: '',
      data_sol: new Date().toISOString(),
    },
  ];
  const adminUser = {
    uid: 'adminUid',
    username: 'adminUsername',
  };
  beforeEach(async () => {
    await db.collection('administradors').doc(adminUser.uid).set({'username': adminUser.username});
    await db.collection('actividades').doc('testIdActivitat').set({
      'a': 'a',
    });
    await db.collection('users').doc('testUid1').set({
      'email': 'testEmail1',
    });
    for (const solicitud of testSolicituds) {
      await db.collection('solicitudsOrganitzador').doc(solicitud.id).set({
        'titol': solicitud.titol,
        'motiu': solicitud.motiu,
        'atorgat': solicitud.atorgat,
        'idActivitat': solicitud.idActivitat,
        'pendent': solicitud.pendent,
        'administrador': solicitud.administrador,
        'data_sol': solicitud.data_sol,
        'usuariSolicitant': 'testUid1',
      })
    }
  });
  it('deberia devolver 404 si la solicitud no existe', async () => {
    const res = await request(app)
    .post('/tickets/solicitudOrganitzador/doesNotExist/acceptar')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`); 
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Solicitud no encontrada');
  });
  it('deberia aceptar una solicitud', async () => {
    const res = await request(app)
    .post('/tickets/solicitudOrganitzador/testUid1/acceptar')
    .set('Authorization',  `Bearer ${encrypt('adminUid').encryptedData}`);
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('Solicitud de organizador aceptada');
  });
  it('deberia devolver 404 si el usuario no es admin', async () => {
    const res = await request(app)
    .post('/tickets/solicitudOrganitzador/testUid1/acceptar')
    .set('Authorization',  `Bearer ${encrypt('testUid1').encryptedData}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Admin no encontrado');
  });
});
