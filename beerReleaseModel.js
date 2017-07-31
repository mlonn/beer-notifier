var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var beerReleseSchema = Schema ({
      release :  String
})

module.exports = mongoose.model('beerReleaseModel',beerReleseSchema)
