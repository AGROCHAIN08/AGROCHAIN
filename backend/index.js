require('dotenv').config();

const connectdb = require('./config/db');
const app = require('./app');

(async() =>{
    await connectdb();
    app.listen(port,()=>{
        console.log(`Server running on port ${PORT}`);
    }
    );
}

)();