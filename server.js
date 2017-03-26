// Set up
var express  = require('express');
var app      = express();                   // create our app w/ express
var mongoose = require('mongoose');         // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var cors = require('cors');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;

//var router = express.Router();
var db;
var uri = "mongodb://wangmo:mlab77@ds155028.mlab.com:55028/heroku_d4fr10z1";
var HERO_COLLECTION = "heroes";
var FAVORITE_COLLECTION = "Likes";
var COMMENT_COLLECTION = "Comments";

app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());
app.use(cors());
 
app.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header('Access-Control-Allow-Methods', 'DELETE, PUT');
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
});


// Configuration
//mongoose.connect(uri);  // 192.168.1.9 //'mongodb://localhost/heroes'
//mongoose.connect('mongodb://127.0.0.1:27017/heroes'); //to the ip address

//for the mongodb configuration for mlab
mongodb.MongoClient.connect((process.env.MONGODB_URI || uri), function (err, database) { //process.env.MONGODB_URI
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});
 
// Model of hero collection
var Hero = mongoose.model('Hero', {
    heroName: String,
    age: Number,
    bio: String,
    isFav :Boolean,
    faith: String,
    nationality:String,
    power: String,
    relation: String,
    gender:String,
    imgUrl: String,
    posted: Date,
    dataUrl: Binary Data
});

 var filterObj = {} ; 
 var skipNo = 0;
 var pageSize = 5;
//based on the filter request, create the filter object to be passed to the mongo db via mongoose.
function filterData(filterReq){

  if(filterReq){

    var filter =  JSON.parse(filterReq); 
      if(filter.heroName){
        filterObj.heroName =  { "$regex": filter.heroName, "$options": "i" } ;
      }
      if(filter.age){
        filterObj.age = filter.age;
      }
      if(filter.relation){
        filterObj.relation =  { "$regex": filter.relation, "$options": "i" };
      }
      if(filter.power){
        filterObj.power =  { $in: filter.power};
      }
       if(filter.gender){
        filterObj.gender = filter.gender;
      }
       if(filter.faith){
        filterObj.faith = { "$regex": filter.faith, "$options": "i" } ;
      }
      if(filter.nationality){
        filterObj.nationality = { $in: filter.power}; //filter.nationality;
      }
    }
     // return filterObj;
}

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

//to return the hero data from the hero db
function getHeroes(res){
 // db.collection("heroes").find(filterObj,function(err, heroes) { // Hero
 //            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
 //            if (err)
 //                res.send(err);
 //             // console.log("getting heroes");
 //            res.json(heroes); // return all heroes in JSON format
 //        }).sort('-posted').skip(skipNo).limit(pageSize);
  //sorted based on date posted with the data size with the page size

 db.collection(HERO_COLLECTION).find(filterObj)
 .sort({'posted' : -1}).skip(skipNo).limit(pageSize)
 .toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);
    }
  });

}


//to return the fav count for the hero
function getFavCount(res){

 db.collection(HERO_COLLECTION).find(filterObj)
 .sort({'posted' : -1}).skip(skipNo).limit(pageSize)
 .toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get favorite counts.");
    } else {
      res.status(200).json(docs);
    }
  });
}

function saveHero(req,res){
  // db.collection("heroes").create({
  //           heroName : req.body.heroName,
  //             isFav : true,
  //             age: req.body.age,
  //             bio: req.body.bio,
  //             nationality: req.body.nationality,
  //             power: req.body.power,
  //             gender: req.body.gender,
  //             faith: req.body.faith,
  //             relation: req.body.relation,
  //             posted: new Date
  //       }, function(err, hero) {
  //           if (err){
  //               res.send(err);
  //           }
  //          // console.log(hero);
  //           skipNo = 0;
  //          // return the new created hero if it fits the filter options
  //         // filterObj._id = hero._id;
  //          //return all the heroes after creating;
  //           getHeroes(res);

  //       });
  var newHero = req.body;
  newHero.posted = new Date();
  db.collection(HERO_COLLECTION).insertOne(newHero, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new hero.");
    } else {
      //res.status(201).json(doc.ops[0]);
       skipNo = 0;
       // return the new created hero if it fits the filter options
          // filterObj._id = hero._id;
           //return all the heroes after creating;
        getHeroes(res);
    }
  });
}

//save favorite
function saveFavorite(req,res){
  var fav = req.body;
  fav.posted = new Date();
  db.collection(FAVORITE_COLLECTION).insertOne(fav, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to add to favorite");
    } else {
     getFavCount(res);
    }
  });

}

// Routes
//check user authorization
    app.get('/api/checkUser', function(req, res) {
        // use mongoose to get all heroes in the database
        Hero.find(function(err, heroes) {
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err);
            res.json(heroes); // return all heroes in JSON format
        });
    });

    // Get heroes via the http get request
    app.get('/api/heroes', function(req, res){ 
       //console.log("mongoose connected");
      //console.log(JSON.stringify(res));
        if(req.query.pageNo){
            skipNo = Number(req.query.pageNo);
        }
        if(req.query.filter){
            filterData(req.query.filter);
        }else{
          filterObj={};
        }
        delete filterObj._id; //remove the filter for id
        getHeroes(res); //get the heroes data from hero db
    });
 
    // create new hero and send back all heroess after creation
    app.post('/api/heroes', function(req, res) {
        if(req.body.filter){
           filterData(req.body.filter);
        }else{
          filterObj={};
        }
        // create a hero, information comes from request from Ionic
        saveHero(req,res);
    });
 
     // create new hero and send back all heroess after creation
    app.post('/api/fav', function(req, res) {
        
        // create a hero, information comes from request from Ionic
        saveFavorite(req,res);
    });
 

    //delete a hero
    app.delete('/api/heroes/:heroId', function(req, res) {
      // console.log(req.params.heroId);
      //   db.collection("heroes").remove({
      //       _id : req.params.heroId
      //   }, function(err, review) {
      //     if(err)
      //       console.log('error in deleting');
      //       console.log('deleted');
      //   });

db.collection(HERO_COLLECTION).deleteOne({_id: new ObjectID(req.params.heroId)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete contact");
    } else {
      res.status(204).end();
    }
  });

    });
 
//  // application -------------------------------------------------------------
// //all of our routes will be prefixed with /api
//  //app.use('/api', router); 
// // listen (start app with node server.js) 
// app.listen( process.env.PORT || 8080);
// console.log("App listening on port 8080");
