const bcrypt = require('bcrypt');
var MongoClient = require('mongodb').MongoClient;

const mongodb_host = process.env.MONGODB_HOST
const mongodb_port = process.env.MONGODB_PORT
const mongodb_username = process.env.MONGODB_USERNAME
const mongodb_password = process.env.MONGODB_PASSWORD
const authenticating_db = process.env.AUTHENTICATING_DATABASE
const mongo_url = `mongodb://${mongodb_username}:${mongodb_password}@${mongodb_host}:${mongodb_port}/homeaway?authSource=${authenticating_db}`

console.log(`Mongo url : ${mongo_url}`)
var _db;

const mongOptions = { 
    reconnectTries: 60,
    reconnectInterval: 1000,
    useNewUrlParser:true,
    autoReconnect : true
}


const connectMongo = async function(){
    try{
        const db = await MongoClient.connect(mongo_url,mongOptions);
        _db = db
        return Promise.resolve(db);
    }catch(error){
        return Promise.reject("Could not connect to mongodb Homeaway");
    }
}



module.exports = {_db,connectMongo};