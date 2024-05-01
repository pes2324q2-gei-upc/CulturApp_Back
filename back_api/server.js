const app = require('./app');
require('dotenv').config();

const PORT = 8080 ||process.env.PORT;

app.listen(PORT, async () => {
    console.log(`Server is working on PORT ${PORT}`);
});
