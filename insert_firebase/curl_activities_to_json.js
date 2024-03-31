const axios = require('axios');
const fs = require('fs');

function fetchActivities() {
    try {

        var url = 'https://analisi.transparenciacatalunya.cat/resource/rhpv-yr4f.json';
        
        const today = new Date();
        var d = today.getFullYear();
        if (today.getMonth() < 10) {
            d += '0' + (today.getMonth() - 1);
        } else { 
            d += '-' + (today.getMonth() - 1);
        }
        if (today.getDay() < 10) {
            d += '0' + today.getDay();
        } else { 
            d += '' + today.getDay();
        }
        d += '000';
        const where = '?$where=codi>=' + d.toString();
        url += where;
        urlActividades = url;
        
        // Realizar la solicitud GET a la API utilizando axios
        axios.get(urlActividades).then((response) => {
            const content = JSON.stringify(response.data);
            const filePath = 'actividades.json'; // Specify the file path where you want to save the data
            
            fs.writeFile(filePath, content, (err) => {
                if (err) {
                  console.error('Error writing file:', err);
                } else {
                  console.log('File written successfully!');
                }
            });
        })

        let urlActividadesAMB = 'https://opendata.amb.cat/activitats/search'
        axios.get(urlActividadesAMB).then((response) => {
            const content = JSON.stringify(response.data);
            const filePath = 'actividadesAMB.json'; // Specify the file path where you want to save the data
            
            fs.writeFile(filePath, content, (err) => {
                if (err) {
                  console.error('Error writing file:', err);
                } else {
                  console.log('File written successfully!');
                }
            });
        })

    } catch (error) {
        // Manejar cualquier error que ocurra durante la solicitud
        console.error('Error al obtener datos desde la API:', error.message);
        return null;
    }
}

// Call the fetchActivities function to initiate the data fetching process
fetchActivities();
