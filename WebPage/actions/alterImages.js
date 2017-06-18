"use strict";

var AWS = require("aws-sdk");
var _ = require("lodash");

var notificationHelper = require("../notificationHelper");

AWS.config.loadFromPath('config/aws-config.json');
var sqs = new AWS.SQS();

var task =  function(request, callback){

    if(!request.body.keys) return notificationHelper.showError("No images selected", callback);

    if(typeof request.body.keys === 'string' ) {
        request.body.keys = [request.body.keys];
    }

    if(request.body.keys.length > 10)  return notificationHelper.showError("Error, more than 10 imagas selected", callback);

    var entries = _.map( request.body.keys, function (key, index) {
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

    sqs.sendMessageBatch(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            return notificationHelper.showError(err, callback);
        }
        else {
            console.log(data);
            if(data.Failed.length === 0) {
                return notificationHelper.showSuccess("All images were queued for convertion", callback);
            } else {
                return notificationHelper.showError("Error " + data.Failed.length + " msg failed", callback);
            }
        }
    });
};

exports.action = task;
