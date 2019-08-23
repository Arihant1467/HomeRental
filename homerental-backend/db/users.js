const MONGO_DB_NAME = require('./../constants/key-value.js').MONGO_DB_NAME;
var mongodb_connection =  null; 
require('./mongodb.js').connectMongo().then((db)=>{
    mongodb_connection = db;
}).catch((error)=>{
    console.log(error);
    console.log("Please restart the mongo server. We could not place a connection")
});

const uuidv1 = require('uuid/v1');
const bcrypt = require('bcrypt');
const saltRounds = 5;

/* TABLE DETAILS */
const DB_TABLE_NAME = "users";
const TABLE_USERID_FIELD = "userid";
const TABLE_USERNAME_FIELD = "username";
const TABLE_PASSWORD_FIELD = "password";


var check_user_credentials = async function(username,password){
    
    try{
        //const db_connection = await mongodb.connectMongo();
        //const homeAwayDB = db_connection.db("HomeAway");
        
        const homeAwayDB = mongodb_connection.db(MONGO_DB_NAME);
        var query = {username:username};
        const docs = await homeAwayDB.collection("users").findOne(query);
        if(docs == null){
            return Promise.reject("Could not spot you");
        }
        
        const hash = docs.password;
        const match = await bcrypt.compare(password, hash);
       
        if(match){
            return Promise.resolve(docs);
        }else{
            return Promise.reject("Password does not match")
        }

    }catch(error){
        return Promise.reject(error);
    }
}


var signup_user = async function(data){
    try{
        const hash = await bcrypt.hash(data.password,saltRounds);
        data["userid"] = uuidv1(); 
        data["password"] = hash;

        const homeAwayDB = mongodb_connection.db(MONGO_DB_NAME);
        var query = {username:data.username};
        const docs = await homeAwayDB.collection("users").findOne(query);
        
        if(docs == null){
            const result = await homeAwayDB.collection("users").insertOne(data);
            return Promise.resolve(data);
        }else{
            return Promise.reject("User already exists");    
        }
        
    }catch(error){
        console.log(error);
        return Promise.reject(error);
    }
}


var userTrips = function(id,callback){
    const query = "SELECT booking.bookingid,booking.userid,booking.startdate,booking.enddate,Property.city, Property.propertyid,Property.address,Property.headline FROM booking INNER JOIN Property ON booking.propertyid = Property.propertyid";
    
    db_connection_pool.query(query,function(error,results,fields){
        
        var newResults = results.filter(record => record.userid === id);
        
        callback(error,newResults,fields);
    });
}

var updateprofile = async function(data,userid){
    
    try{

        const homeAwayDB = mongodb_connection.db(MONGO_DB_NAME);
        var query = {"userid" : userid};
        var fields = {_id:0,firstname:1,lastname:1,username:1,password:1,userid:1}
        var docs = await homeAwayDB.collection("users").findOne(query,{"fields" : fields});
        if(docs == null){
            return Promise.reject("Could not spot you"); 
        }
        
        const result = {
            "firstname" : docs.firstname,"lastname"  : docs.lastname,
            "username"  : docs.username,"password"  : docs.password
        }

        var hash = docs.password;
        const {firstname,lastname,username,password} = data;
        if(password){
            hash = await bcrypt.hash(password,saltRounds);
        }
        
        const updatedResult = Object.assign({},result,
            {firstname,lastname,username,password:hash});
        
        const update = await homeAwayDB.collection("users").updateOne(query,{$set : {
            "firstname":updatedResult.firstname,
            "lastname":updatedResult.lastname,
            "username" : updatedResult.username,
            "password" : updatedResult.password
        }});
        
        return Promise.resolve(update.result);
    }catch(error){
        console.log(error);
        return Promise.reject("Could not connect to db");
    }
}

var getProfile = async function(userid){
    
    try{

        const homeAwayDB = mongodb_connection.db(MONGO_DB_NAME);
        var query = { "userid": userid };
        var fields = { _id: 0, firstname: 1, lastname: 1, username: 1, password: 1, userid: 1 }
        var docs = await homeAwayDB.collection("users").findOne(query, { "fields": fields });

        if (docs == null) {
            return Promise.reject("Could not spot you")
        }

        const user = {
            "username": docs.username,
            "firstname": docs.firstname,
            "lastname": docs.lastname
        }

        return Promise.resolve(user);

    }catch(error){
        return Promise.reject("Could not connect to DB");
    }
}

module.exports = {
check_user_credentials,signup_user,
userTrips,updateprofile,getProfile
};