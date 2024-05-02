const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT;

app.listen(PORT, async () => {
    console.log(`Server is working on PORT ${PORT}`);
});
