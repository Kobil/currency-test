var request = require("request-promise");
var HTMLParser = require('fast-html-parser');
var global_data = require('./global_data');

var moment = global_data.moment;
var util = require('util');

var updateCurrenciesTSB = function(){
    
    return new Promise((resolve, reject)=> {
            request("http://www.tsb.tj")
            .then((body)=>{
                var root = HTMLParser.parse(body);
                //console.log(body);
            
                //console.log(util.inspect(root, false, null));
                //console.log(root.childNodes)
                let node = root.querySelector(".cur_state.asor");
                let table = node.querySelector("table"); 
                let trs = node.querySelectorAll("tr");
                //#container > div:nth-child(8) > div.cur_state.asor > table > tbody > tr:nth-child(1)
                //console.log(util.inspect(trs, false, null));
            
                let result = [];
                let today = moment().format();
            
                let tdsUSD = trs[0].querySelectorAll("td");
                //console.log(util.inspect(tdsUSD[0].childNodes[0].rawText, false, null) + " " + util.inspect(tdsUSD[2].childNodes[0].rawText, false, null) + " " + util.inspect(tdsUSD[3].childNodes[0].rawText, false, null)); 
                result[840] = {
                    date : today,
                    nominal : +(tdsUSD[0].childNodes[0].rawText.split(" "))[0],
                    purchase : +tdsUSD[2].childNodes[0].rawText,
                    sale : +tdsUSD[3].childNodes[0].rawText,
                }
            
                let tdsEUR = trs[1].querySelectorAll("td");
                //console.log(util.inspect(tdsEUR[0].childNodes[0].rawText, false, null) + " " + util.inspect(tdsEUR[2].childNodes[0].rawText, false, null) + " " + util.inspect(tdsEUR[3].childNodes[0].rawText, false, null)); 
                result[978] = {
                    date : today,
                    nominal : +(tdsEUR[0].childNodes[0].rawText.split(" "))[0],
                    purchase : +tdsEUR[2].childNodes[0].rawText,
                    sale : +tdsEUR[3].childNodes[0].rawText,
                }
            
                let tdsRUB = trs[2].querySelectorAll("td");
                //console.log(util.inspect(tdsRUB[0].childNodes[0].rawText, false, null) + " " + util.inspect(tdsRUB[2].childNodes[0].rawText, false, null) + " " + util.inspect(tdsRUB[3].childNodes[0].rawText, false, null)); 
                result[810] = {
                    date : today,
                    nominal : +(tdsRUB[0].childNodes[0].rawText.split(" "))[0],
                    purchase : +tdsRUB[2].childNodes[0].rawText,
                    sale : +tdsRUB[3].childNodes[0].rawText,
                }
                //var doc = new dom().parseFromString(body);
                //console.log(xpath.select('//*[@id="container"]/div[7]/div[3]', doc));
                resolve(result);
                return result;
            }) .catch((err)=>{
                reject(err);
            });
        });    
}


var updateTsbDb = function(db){
    let collRef = db.collection('banks');
    let bank_info = {
        name : "tsb"
    }
    collRef.doc('tsb').set(bank_info);
    console.log("runTSB started");
    updateCurrenciesTSB()
    .then((result)=>{
        console.log("result: " + util.inspect(result, false, null));
        for(let i = 0; i < result.length; i++) {
            if (typeof result[i] !== "undefined") {
                //let data = await getDoc(db.collection('tsb').doc('valute_' + i));
                let document = db.collection('tsb').doc('valute_' + i);
                document.get()
                    .then(function(doc) {
                        let data;
                        if (!doc.exists) {
                            console.log('No such document!');
                            data = {
                                bankName : "TSB",
                                valute_id : i,
                                currencies : [] 
                            }
                        } else {
                            data = doc.data();
                        }
                        console.log("data:" + util.inspect(data, false, null));
                        data.currencies[data.currencies.length] = {
                            date : result[i].date,
                            nominal : result[i].nominal,
                            purchase : result[i].purchase,
                            sale : result[i].sale
                        } 
                        //console.log("result[" + i + "]:" + util.inspect(result[i], false, null));
                        console.log("data:" + util.inspect(data, false, null));
                        db.collection('tsb').doc('valute_' + i).set(data);
                        return doc;
                    })
                    .catch(err => {
                        console.log('Error getting document', err);
                        return null;
                    });
                //console.log("Data:" + util.inspect(data, false, null));
                /*if (typeof data === "undefined") {
                    data = {
                        bankName : "TSB",
                        valute_id : i,
                        currencies : [] 
                    }
                }*/
            
                
            }
        }
        return null;
    }).catch((err)=>{
        throw err;
    });
}

var test = function(url){
    var req = require('request');
    req(url, function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
    });
}

module.exports.run = function(db){
    console.log("tsb started");
    //updateTsbDb(db);
    test("http://www.amonatbonk.tj");
    test("http://www.nbt.tj");
    test("http://www.tsb.tj");
    console.log("tsb finished");
} 