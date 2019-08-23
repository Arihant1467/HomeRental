
const MONGO_DB_NAME = require('./../constants/key-value.js').MONGO_DB_NAME;

var mongodb_connection = null;
require('./mongodb.js').connectMongo().then((db)=>{
    mongodb_connection = db;
}).catch((error)=>{
    console.log(error);
    console.log("Please restart the mongo server. We could not place a connection")
})


const uuidv1 = require('uuid/v1');
/*
const DB_TABLE_PROPERTY="Property";
const DB_TABLE_PROPERTY_LOCATION = "PropertyLocation";
const DB_TABLE_PROPERTY_DETAILS = "PropertyDetails";
const DB_TABLE_PROPERTY_PHOTOS = "PropertyPhotos";
const DB_TABLE_PROPERTY_PRICING = "PropertyPricing";

const DB_COLUMN_PROPERTY_ID = "propertyid"; // VARCHAR 100
const DB_COLUMN_OWNER_ID = "ownerid";       // VARCHAR 100

const DB_COLUMN_COUNTRY = "country";        // VARCHAR 50
const DB_COLUMN_ADDRESS = "address";        //Text
const DB_COLUMN_UNIT = "unit";              //Text
const DB_COLUMN_POSTAL = "postal";          //VARCHAR 10
const DB_COLUMN_CITY = "city";              //Text
const DB_COLUMN_SUB_STATE = "subState";     //VARCHAR 100

const DB_COLUMN_HEADLINE = "headline";      //Text
const DB_COLUMN_DESCRIPTION = "description";//Text
const DB_COLUMN_TYPE = "type";              //INT 11
const DB_COLUMN_BEDROOM = "bedrooms";       //INT 2
const DB_COLUMN_ACCOMODATE = "accomodate";  //INT 3
const DB_COLUMN_BATHROOM = "bathroom";      //INT 2

const DB_COLUMN_PHOTOS = "photos";          //Text

const DB_COLUMN_START_DATE = "startdate";   //Text
const DB_COLUMN_END_DATE = "enddate";       //Text
const DB_COLUMN_BASE_RATE = "baserate";     //INT 5
const DB_COLUMN_MINIMUM_STAY = "minimumstay";//INT 3
*/
/*
var insertPorpertyDetails = function(data,callback){
    
    const query = "INSERT INTO "+DB_TABLE_PROPERTY+" SET ?";
        
        db_connection_pool.query(query,data,function(error,results,fields){
            if(error){
                const id = data.propertyid;
                delete data["propertyid"];
                const newQuery = "UPDATE "+DB_TABLE_PROPERTY+" SET? WHERE propertyid=?";
                db_connection_pool.query(newQuery,[data,id],function(e,r,f){
                    callback(e,r,f);
                })
            }else{
                callback(error,results,fields);
            }
        });
}
*/

var addProperty = async function(ownerid,property){
    try{
        //const db_connection = await mongodb.connectMongo();
        //const homeAwayDB = db_connection.db("HomeAway");
        
        var {startdate,enddate} = property;
        startdate = new Date(startdate).getTime()/1000;
        enddate = new Date(enddate).getTime()/1000;

        const newProperty = Object.assign({},property,{startdate,enddate});
        const homeAwayDB = mongodb_connection.db(MONGO_DB_NAME);
        
        const docs = await homeAwayDB.collection("users").updateOne(
            {userid : ownerid},
            {$addToSet : {
                properties : newProperty
            }}
        );
        
        if(docs.result.nModified == 1){
            return Promise.resolve("Property added successfully");
        }else{
            return Promise.reject("Could not add the property. Please try again later");
        }

    }catch(error){
        console.log(error);
        return Promise.reject("Could not connect to db");
    }
}



var retrievePropertyDetails = async function(propertyid,callback){
    
   try{
    const homeAwayDB = mongodb_connection.db(MONGO_DB_NAME);
    var docs = await homeAwayDB.collection("users").find(
        {"properties.propertyid" : propertyid},
    )
    
    if(docs == null){
        return Promise.reject("No such property found");
    }

    docs = docs.project({_id:0,"userid":1,"username":1,"properties.$":1});
    const documents = await docs.toArray();
    const property = documents[0].properties[0];
    const modifiedProperty = Object.assign({},property,{"ownerid":documents[0].userid,"ownername":documents[0].username});
    
    return Promise.resolve(modifiedProperty);

   }catch(error){
       return Promise.reject(error);
   }

}


var ownerPropertyListing = async function(ownerid,page){
    if(page <=0 ){  return Promise.resolve([]); }
    const limit = 5;
    try{
        const homeAwayDB = mongodb_connection.db(MONGO_DB_NAME);
        const docs = await homeAwayDB.collection("users").aggregate([
            {$unwind : "$properties"},
            {$match : {userid : ownerid}},
            {$project : {_id:0,properties:1}},
            {$sort :  { "properties.baserate" :1 } },
            {$skip : limit*(page-1)},
            {$limit : limit}
        ]);

        if(docs == null){
            return Promise.reject("nothing found");
        }

        const document = await docs.toArray();
        listings=[]
        document.forEach((element,index)=>{
            listings.push(element.properties);
        });
        return Promise.resolve(listings);
        
    }catch(error){
        console.log(error);
        return Promise.reject(error);
    }

}

var tripboards = async function(userid,page){
    const limit = 5;
    if(page <=0 ){
        return Promise.resolve([]);
    }
    try{
        const homeAwayDB = mongodb_connection.db(MONGO_DB_NAME);
        const docs = await homeAwayDB.collection("users").aggregate([
            {$unwind : "$trips"},
            {$match : {userid : userid}},
            {$project : {_id:0,trips:1}},
            {$sort :  { "trips.startdate" :1 } },
            {$skip : limit*(page-1)},
            {$limit : limit}
        ]);

        if(docs == null){   return Promise.reject("nothing found"); }

        const document = await docs.toArray();
        trips=[]
        document.forEach((element,index)=>{
            trips.push(element.trips);
        });

        return Promise.resolve(trips);
        
    }catch(error){
        console.log(error);
        return Promise.reject(error);
    }
}

// Bookings
var booking = async function(propertyid,data){
    var {userid,ownerid,city,headline,startdate,enddate,username,ownername} = data;
    const epochsecondsstartdate = new Date(startdate).getTime()/1000;
    const epochsecondsenddate = new Date(enddate).getTime()/1000;

    if(![userid,ownerid,city,headline,startdate,enddate,username,ownername].every(Boolean)){
        return Promise.reject("not valid parameters");
    }

    var booking = {
        propertyid,city,headline,
        startdate:epochsecondsstartdate,
        enddate:epochsecondsenddate,
        travellerid : userid,
        travellername:username
    }

    var tripdetail  = {
        propertyid,city,headline,
        startdate:epochsecondsstartdate,
        enddate:epochsecondsenddate,
        ownerid,ownername
    }

    try{
        const homeAwayDB = mongodb_connection.db(MONGO_DB_NAME);
        const bookingDetails = await homeAwayDB.collection("users").updateOne(
            { userid: ownerid },
            { $addToSet: { bookings: booking } }
        );

        const tripDetails = await homeAwayDB.collection("users").updateOne(
            { userid: userid },
            { $addToSet: { trips: tripdetail } }
        );
        
        const nestedBooking = await homeAwayDB.collection("users").updateOne(
            {userid : ownerid, "properties.propertyid" : propertyid},
            {$addToSet : {"properties.$.booking" : booking } }
        );

        return Promise.resolve("done");
    }catch(error){
        return Promise.reject("Could not book");
    }

}

var searchCriteria = async function(data){
    
    const {city,startdate,enddate,accomodate,stepper} = data;
    var {bedroom,price,userid} = data;
    
    const regexcity = new RegExp(city,'i'); 
    const epochsecondsstartdate = new Date(startdate).getTime()/1000;
    const epochsecondsenddate = new Date(enddate).getTime()/1000;
    const maxPages = 5; 

    if(bedroom==null){bedroom="0"}
    if(price==null){price="999"}
    if(userid==null){userid="0"}
    /*
        {$skip : 5}
        "properties.startdate" : {$gte : epochsecondsstartdate},
        "properties.enddate" :   {$lte : epochsecondsenddate}
    */
    try{
        
        const homeAwayDB = mongodb_connection.db(MONGO_DB_NAME);
        const docs = await homeAwayDB.collection("users").aggregate([
            {$unwind : "$properties"},
            {$project : {_id:0,properties:1,userid:1}},
            {$match :  {$and:[
                {"userid" : {$ne : userid}},
                {"properties.city" : regexcity},
                {"properties.accomodate" : {$gte:accomodate}},
                {"properties.startdate" : {$lte :epochsecondsstartdate } },
                {"properties.enddate": {$gte:epochsecondsenddate } },
                {"properties.bedroom" : {$gte: bedroom } },
                {"properties.baserate" : {$lte: price } }
                ]}},
            {$sort : {"properties.baserate" : 1}},
            {$skip : maxPages*(stepper-1)},
            {$limit : maxPages}
        ]);

        if(docs == null){
            return Promise.reject("We could not find any results. Please try changing the options");
        }

        const result = await docs.toArray();
        const search = [];
        result.forEach(element => {
            const userid = element.userid;
            const properties = element.properties;
            const obj = Object.assign({},properties,{userid});
            search.push(obj);
        });

        return Promise.resolve(search);

    }catch(error){
        console.log(error);
        return Promise.reject("Could not connect to db");
    }
    

}

// messages
var messageToTravellerAndOwner = async function(userid,data){
    
    const {ownerid,ownername,username,message,propertyid} = data;
    if(userid === ownerid){
        return Promise.reject("bad request");
    }
    /* from message
    {
            "timestamp" : ISODate("2018-10-31T20:15:09.017Z"),
            "type" : "received",
            "fromuserid" : "459423e0-d634-11e8-90f5-1f9c232adc78",
            "fromusername" : "srinivas",
            "propertyid" : "07fd1d20-cb9e-11e8-8ef3-47fc2295dc46",
            "userid" : "11c0a7b0-d11f-11e8-8494-c5db8bbb1e98",
            "msg" : "Its already mentioned in the post"
        }
    */

    /*
    { To message
            "timestamp" : ISODate("2018-10-31T20:29:01.393Z"),
            "type" : "sent",
            "touserid" : "459423e0-d634-11e8-90f5-1f9c232adc78",
            "tousername" : "srinivas",
            "propertyid" : "07fd1d20-cb9e-11e8-8ef3-47fc2295dc46",
            "userid" : "11c0a7b0-d11f-11e8-8494-c5db8bbb1e98",
            "msg" : "I just wanted to confirm again."
        }, 
    */
   const msgTimeStamp = new Date().toISOString();
   const msgid = uuidv1();
   const toMessage = {
       timestamp : msgTimeStamp,type:"sent",msg:message,msgid,
       propertyid : propertyid,
       userid : userid, touserid:ownerid,tousername:ownername
   }

   const fromMessage = {
        timestamp : msgTimeStamp,type:"received",msg:message,msgid,
        propertyid : propertyid,
        userid : ownerid, fromuserid:userid,fromusername:username
    }

    try{
        const homeAwayDB = mongodb_connection.db(MONGO_DB_NAME);
        const docsOne = await homeAwayDB.collection("users").updateOne(
            { userid: userid },
            { $addToSet: { msg: toMessage } }
        );

        const docsTwo = await homeAwayDB.collection("users").updateOne(
            { userid: ownerid },
            { $addToSet: { msg: fromMessage } }
        );

        return Promise.resolve("done");
    }catch(error){
        return Promise.reject("Could not send the message");
    }
    
}


var fetchUserMessages = async function(userid){
    try{

        const homeAwayDB = mongodb_connection.db(MONGO_DB_NAME);
        const docs = await homeAwayDB.collection("users").find({ userid: userid });
        if(docs==null){ return Promise.reject("Could not find the user"); }
        var msg = docs.project({_id:0,"msg":1});
        msg = await msg.toArray();
        msg = msg[0].msg;
        msg.sort((a,b)=>{ return a.timestamp>b.timestamp });
        
        var properties = [];
        var userids = [];
        msg.forEach((message)=>{
             
            var found = false;
            properties.forEach((property)=>{
                if(property.propertyid == message.propertyid){
                    found = true;
                }
            });

            if(!found){
                properties.push({propertyid:message.propertyid,users:[]});
            }
         });

         
         properties.forEach((property)=>{

            msg.forEach((message)=>{
                if(message.propertyid == property.propertyid){
                    
                    property.users.push(message);
                }
            });
            
         });
         
        return Promise.resolve(properties);

    }catch(error){
        console.log(error);
        return Promise.reject("Could not connect to DB");
    }
}

module.exports = {
    addProperty,retrievePropertyDetails,ownerPropertyListing,
    searchCriteria,booking,messageToTravellerAndOwner,tripboards,
    fetchUserMessages
}