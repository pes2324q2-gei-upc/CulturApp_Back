const app = require('./app');

const NodeCache = require("node-cache");
require('dotenv').config();

const{db, auth} = require('./firebaseConfig');

const PORT = process.env.PORT;


app.listen(PORT, async () => {
    console.log(`Server is working on PORT ${PORT}`);
});




