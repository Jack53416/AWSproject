var fs = require('fs');
var crypto = require('crypto');
var async = require("async");


var hmac = function(algorithm, key, text, encoding) {
	var hmac = crypto.createHmac(algorithm, key);
	return hmac.update(new Buffer(text)).digest(encoding);
}

var encode = function(obj, encoding) {
	var stringifyObj = JSON.stringify(obj);	
	return new Buffer(stringifyObj).toString(encoding);
}

var readJSONFile = function(fileName){
	if(!fs.existsSync(fileName)) {
		console.log("unable to open file: " + fileName);
		throw new Error("unable to open file: " + fileName);
	}
	var data = fs.readFileSync(fileName, {encoding:'utf8'});
	console.log(data);
	var object = JSON.parse(data);
	return object;	  	
}

exports.hmac = hmac; // = function(algorithm, key, text, encoding)
exports.encode = encode; //encode = function(obj, encoding)
exports.readJSONFile = readJSONFile; // = function(fileName)