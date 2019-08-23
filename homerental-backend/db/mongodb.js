const bcrypt = require('bcrypt');
var MongoClient = require('mongodb').MongoClient;

const mongodb_host = process.env.MONGODB_HOST
const mongodb_port = process.env.MONGODB_PORT
const mongodb_username = process.env.MONGODB_USERNAME
const mongodb_password = process.env.MONGODB_PASSWORD
const mongo_url = `mongodb://${mongodb_username}:${mongodb_password}@${mongodb_host}:${mongodb_port}/homeaway?authSource=admin`

console.log(`Mongo url : ${mongo_url}`)
var _db;

const connectMongo = async function(){
    try{
        const db = await MongoClient.connect(mongo_url,{useNewUrlParser:true});
        _db = db
        return Promise.resolve(db);
    }catch(error){
        return Promise.reject("Could not connect to mongodb Homeaway");
    }
}



module.exports = {_db,connectMongo};