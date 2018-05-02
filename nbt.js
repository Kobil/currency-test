var request = require("request-promise");
var util = require('util');
var global_data = require('./global_data');

var moment = global_data.moment;

var parseString = require('xml2js-parser').parseString;
var parseStringSync = require('xml2js-parser').parseStringSync;

var addDataToValuteList = function(kurs, valutes, prefix){
    console.log("addDataToValuteList {");
    for(let i=0; i<kurs.length; i++){
        //console.log(kurs[i].$.ID);
        let temp = {
            id : kurs[i].$.ID,
            charcode : kurs[i].CharCode[0],
            name_ru : kurs[i].Name[0],
            name_en : kurs[i].Name[0],
            name_tj : kurs[i].Name[0]
        };
        if (typeof valutes[temp.id] !== "undefined") {
            valutes[temp.id].id = temp.id;
            valutes[temp.id].charcode = temp.charcode;
            switch (prefix) {
                case "ru" : valutes[temp.id].name_ru = temp.name_ru;
                            break;
                case "en" : valutes[temp.id].name_en = temp.name_en;
                            break;
                case "tj" : valutes[temp.id].name_tj = temp.name_tj;
                            break;
            }
        } else {
            valutes[temp.id] = temp;
        }
        //colRef.doc('valute_' + kurs[i].$.ID).set(temp);
    } 
    //console.log("prefix: " + prefix + " result: " + util.inspect(kurs, false, null));
    //console.log("valutes: " + util.inspect(valutes, false, null));
    console.log("addDataToValuteList }");
    return null;
}

var getListOfValutesNbtInLang = function(langs, valutes, loop){
    console.log("valutes.length:=" + valutes.length);
    console.log("loop:=" + loop);
    console.log("langs.length:=" + langs.length);
    console.log("getListOfValutesNbtInLang(" + langs[loop]+  ") {");
    let url = "http://nbt.tj/" + langs[loop] + "/kurs/export_xml.php?date=2015-07-31&export=xmlout";
    console.log("url: " + url);
    return new Promise((resolve, reject) => {
        request(url).then((body)=>{

            console.log("1111");
            
            return parseString(body, (err, result)=>{
                if (err) throw err;
                console.log("2222");
               
                let kurs = result.ValCurs.Valute; 
                addDataToValuteList(kurs, valutes, langs[loop]);

                if (loop + 1 < langs.length) {
                    console.log("333");
                    getListOfValutesNbtInLang(langs, valutes, loop + 1).then((res)=>{
                        resolve(valutes);
                        return valutes;
                    }).catch((err)=>{
                        reject( err);
                    });
                } else {
                    resolve(valutes);
                }
                console.log("getListOfValutesNbtInLang }");
                
            });
        }).catch((err)=>{
            reject(err);
        });
    });
}

var updateListOfValutesFromNbt = function(db){
    let valutes = [];
    let valutesId = [];
    getListOfValutesNbtInLang(["ru", "en", "tj"], valutes, 0).then((valutes)=>{
        console.log("valutes: " +  util.inspect(valutes, false, null))
        let refCollection = db.collection('valute');
        
        for(let i=0, j=0; i < valutes.length; i++){
            if(typeof valutes[i] !== "undefined" ){
                //console.log("Valutes[" + i + "]=" + util.inspect(valutes[i], false, null));
                refCollection.doc("valute_"+ valutes[i].id).set(valutes[i]);
                valutesId[j] = valutes[i].id;
                j++;
            }
        }
        let valutes_id = {
            bank_name : "nbt",
            valutes : valutesId
        }
        refCollection.doc("valutes_id").set(valutes_id);
        return null;
    }).catch((err)=>{
        console.error(err);
    });
    
   // console.log("ReqRes: " + util.inspect(reqRes, false, null));
}




var updateNbtCurrencies = function(db, valuteId){
    let today = moment();
    let tenYearPred =  moment(today).subtract(10, "years");
    console.log("dates: from " + tenYearPred + " to " + today);
    let url = "http://nbt.tj/tj/kurs/export_xml_dynamic.php?d1=" + tenYearPred.format('YYYY-MM-DD') + "&d2=" + today.format('YYYY-MM-DD') + "&cn=" + valuteId +  "&export=xml";
    console.log("url: " + url);
    return new Promise((resolve, reject)=>{ 
        request(url).then((reqRes)=>{
            //console.log("reqRes: " + util.inspect(reqRes, false, null));
            parseString(reqRes, (err, result)=>{
                if (err) throw err;
                //console.log("result: " + util.inspect(result, false, null));
                let kurs = result.ValCurs.Record;
                let currency = [];
                for(let i=0; i < kurs.length; i++){
                    let temp = {
                        date : kurs[i].$.Date,
                        nominal : kurs[i].Nominal[0],
                        value : kurs[i].Value[0]
                    };
                    currency[i] = temp;
                }
                let curr = {
                    bank_name : "nbt",
                    period : "10 year",
                    valute_id : valuteId,
                    progress : currency
                }
                let colRef = db.collection('nbt');
                colRef.doc("nbt_" + valuteId).set(curr);
                //console.log("currency: " + util.inspect(curr, false, null));
                console.log("nbt_" + valuteId);
                resolve();
            });
            return null;
        }).catch((err)=>{
            throw err;
        });
    })
}

var getAllNbtValuteId = function(db){
    
    let valutesRef = db.collection('valute').doc('valutes_id');
    return new Promise((resolve, reject)=>{
        valutesRef.get()
            .then((doc)=>{
                if (!doc.exists) {
                    console.log('No such document!');
                    reject(doc.exists);
                } else {
                    //console.log('Document data:', doc.data());
                    resolve(doc.data());
                }
                return null;
            })
            .catch(err => {
                console.log('Error getting document', err);
                reject(err);
            });
    });
}

module.exports.run = function(db){
    console.info("nbt started");
    //updateListOfValutesFromNbt(db);
    getAllNbtValuteId(db)
        .then((valutesIdDoc)=>{
            let valutesNbtId = valutesIdDoc.valutes; 
            //console.log("valutesNBT : " + util.inspect(valutesIdDoc, false, null));
            for(let i=0; i < valutesNbtId.length; i++) {
                //await 
                updateNbtCurrencies(db, valutesNbtId[i]);
            }
            //updateNbtCurrencies(db, 840);
            console.info("nbt finished");
            return null;
           
        }).catch((err)=>{
            throw err;
        });
    
}