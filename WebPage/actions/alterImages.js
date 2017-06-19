"use strict"; 

var AWS = require("aws-sdk");
var _ = require("lodash");
var async = require("async");

var notificationHelper = require("../notificationHelper");

AWS.config.loadFromPath('config/aws-config.json');
var sqs = new AWS.SQS();

var task =  function(request, callback){

    if(!request.body.keys) 
		return callback(null, {template: "notification.ejs", params: {state:err, "err": 'No images selected'}});

    var reqArr = request.body.keys.toString().split(',');
	if(reqArr.length > 10) 
		return callback(null, {template: "notification.ejs", params: {state: "err", err: 'Cannot send more than 10 images at once'}});

/*	var index =0;
	var entries = [{
            Id: index.toString(),
            MessageBody: JSON.stringify(
                {
                    option: request.body.option,
                    key: reqArr
                }
            )
        }];
		*/
    var entries = _.map(reqArr, function (key, index) {
        return {
            Id: index.toString(),
            MessageBody: JSON.stringify(
                {
                    option: request.body.option,
                    key: key
                }
            )
        }
    });
	

    var params = {
        QueueUrl: 'https://sqs.us-west-2.amazonaws.com/440412059271/awsPsoirQueue',
        Entries: entries
    };
	console.log("Entries length: " + entries.length);
    sqs.sendMessageBatch(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            return callback(null, {template: "notification.ejs", params: {state: "err", err: err}});
        }
        else {
            console.log(data);
            if(data.Failed.length === 0)
			{
                return callback(null, {template: "notification.ejs", params: {state: "sucess", err: null}});
            } 
			else 
			{
                return callback(null, {template: "notification.ejs", params: {state: "err", err: "Message Failed"}});
            }
        }
    });
};

exports.action = task;
