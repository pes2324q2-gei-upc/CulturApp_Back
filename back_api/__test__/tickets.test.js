const request = require('supertest');
const express = require('express');
const admin = require('firebase-admin');
const app = express();

// Importa el enrutador desde tickets.js
const router = require('../routes/tickets');

// Monta el enrutador en la aplicación Express
app.use('/tickets', router);

let documents = [
  { 
    id: '1', 
    data: () => ({
      user: '1', 
      motiuReport: 'toxicitat en el chat', 
      usuariReportat: '2', 
      solucionat: false, 
      administrador: '' 
    }) 
  }, 
  { 
    id: '2', 
    data: () => ({
      user: '2', 
      motiuReport: 'toxicitat en el chat', 
      usuariReportat: '1', 
      solucionat: true, 
      administrador: '4' 
    }) 
  }
];


jest.mock('firebase-admin', () => {

  return {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    firestore: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      add: jest.fn().mockResolvedValue('OK'), // Simulamos la función add para agregar un documento
      get: jest.fn().mockResolvedValue(documents),
      where: jest.fn().mockImplementation((field, operator, value) => {
        // Filtramos los documentos basándonos en los criterios proporcionados
        const filteredDocuments = documents.filter(document => {
            switch(operator) {
                case '==':
                    return document.data()[field] === value;
                case '!=':
                    return document.data()[field] !== value;
                case '>':
                    return document.data()[field] > value;
                case '<':
                    return document.data()[field] < value;
                case '>=':
                    return document.data()[field] >= value;
                case '<=':
                    return document.data()[field] <= value;
                default:
                    return false;
            }
        });
        return {
            get: jest.fn().mockResolvedValue(filteredDocuments)
        };
    })
    }),
    auth: jest.fn().mockReturnThis(),
  };
});

/*
    Esto es útil cuando estás probando código que interactúa con funciones asíncronas, como 
    las operaciones de la base de datos de Firestore.

    En cuanto a jest.mock, es una función que se utiliza para reemplazar un módulo real con 
    una versión simulada (mock version) para las pruebas. Cuando llamas a jest.mock('firebase-admin'), 
    Jest reemplaza todas las instancias de firebase-admin en tu código de prueba con la versión simulada que definiste.

    No necesitas llamar explícitamente al módulo simulado en tu código de prueba. Cada vez que 
    tu código de prueba importa firebase-admin, Jest automáticamente utiliza la versión simulada en lugar de la real.

    Por ejemplo, si tienes este código en tu prueba:

    admin será el módulo simulado que definiste con jest.mock, no el módulo firebase-admin 
    real. Esto te permite controlar el comportamiento de firebase-admin en tus pruebas y 
    hacer afirmaciones sobre cómo se llama a sus métodos.

*/

describe('test POST /tickets/create/reportUsuari', () => {
  it('create a report from an user to another', async () => {
    const reportData = {
      uid: '1', 
      report: 'toxicitat en el chat', 
      usuariReportat: '2', 
    };

    const response = await request(app)
      .post('/tickets/create/reportUsuari')
      .send(reportData);

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('OK');
    expect(admin.firestore().collection().add).toHaveBeenCalledWith(documents[0].data());
  });
}); //Test extras, revisar si entra un motivo vacio, etc.

/*Comprueba si se ha llamado a la función add con los datos correctos, no coincide con el 
add de lo puesto antes en jest. Lo que verifica es que le haya entrado al add el objeto 
con los datos correcto. No que efectivamente se ha creado en la base de datos porque si fuera asi 
no tendría sentido la creación de una prueba unitaria*/


describe('test GET /tickets/read/reportsUsuari/all', () => {
  it('should return all reports of users', async () => {
    const response = await request(app).get('/tickets/read/reportsUsuari/all');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(documents.map(doc => doc.data()));
    expect(admin.firestore().collection).toHaveBeenCalledWith('reportsUsuaris');
    expect(admin.firestore().collection().get).toHaveBeenCalled();
  });
});


describe('test GET /tickets/read/reportsUsuaris/pendents', () => {
  it('should return all unresolved reports of users', async () => {
    const response = await request(app).get('/tickets/read/reportsUsuaris/pendents');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([documents[0].data()]);
    expect(admin.firestore().collection).toHaveBeenCalledWith('reportsUsuaris');
    expect(admin.firestore().collection().where).toHaveBeenCalledWith('solucionat', '==', false); //Se ha llamado a la coleccion con el where
  });
});


describe('test GET /tickets/read/repostsUsuaris/solucionats', () => {
  it('should return all resolved reports of users', async () => {
    const response = await request(app).get('/tickets/read/reportsUsuaris/solucionats');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([documents[1].data()]);
    expect(admin.firestore().collection).toHaveBeenCalledWith('reportsUsuaris');
    expect(admin.firestore().collection().where).toHaveBeenCalledWith('solucionat', '==', true);
  });
});


describe('test GET /tickets/reportsUsuari/solucionat/admin/:id', () => {
  it('should return all resolved reports of users by admin', async () => {
    const id_admin = '4'; 

    const response = await request(app).get('/tickets/reportsUsuari/solucionat/admin/' + '4');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([documents[1].data()]);
    expect(admin.firestore().collection).toHaveBeenCalledWith('reportsUsuaris');
    expect(admin.firestore().collection().where).toHaveBeenCalledWith('solucionat', '==', true);
    expect(admin.firestore().collection().where).toHaveBeenCalledWith('administrador', '==', id_admin);
  });
});