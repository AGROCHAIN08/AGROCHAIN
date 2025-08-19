const mongoose = import('mongoose');

async function connectdb(){
    const uri = process.env.MONGODB_URI;
    mongoose.await(uri);
    return mongoose.connection;
}

module.exports = connectdb;