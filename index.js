const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

var util = require('util');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

var nbt = require("./nbt");
var tsb = require("./tsb");

var scrape = require('website-scraper');

var options = {
  urls: ['http://nodejs.org/'],
  directory: '/path/to/save/',
};
 


exports.helloWorld = functions.https.onRequest((req, res) => {
    console.log("Currency Started");
   
    // nbt.run(db);
    //tsb.run(db);

        // with promise
    scrape(options).then((result) => {
        /* some code here */
        console.log(util.inspect(result, false, null));
        return result;
    }).catch((err) => {
        /* some code here */
        console.error(err);
    });
    res.send("Hello from Firebase!");
    console.log("Currency Finished");
});


