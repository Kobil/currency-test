var moment = require('moment-timezone');

module.exports.moment = function(){
    return moment().tz("Asia/Tashkent");
}