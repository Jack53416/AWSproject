"use strict";

var jimp = require("jimp");
var sleep = require('sleep');
var AWS = require("aws-sdk");
var _ = require("lodash");
var moment = require("moment");
var del = require("delete");
var async = require("async");
var fs = require("fs");
var path  = require("path");

AWS.config.loadFromPath('aws-config.json');

var sqs = new AWS.SQS();
var s3 = new AWS.S3();

var queueUrl = "https://sqs.us-west-2.amazonaws.com/440412059271/awsPsoirQueue";
var bucketName = "awspsoir";
var viableOptions = ["greyScale", "invert"];

// Comment to not run app
run();

function run() {
    var receiptHandleMsg;

    async.waterfall([
            function (cb) {
                return receive(cb);
            },
            function (msgBody, receiptHandle, cb) {
                // save in var to not pass through whole waterfall
                receiptHandleMsg = receiptHandle;
                return validateMsgBody(msgBody, cb);
            },
            function (msgBody, cb) {
                return convertImage(msgBody, cb);
            },
            function (convertedFileName, cb) {
                return saveConvertedImageInBucket(convertedFileName, cb);
            },
            function (convertedFileName, cb) {
                return deleteLocalConvertedFile(convertedFileName, cb);
            },
            function (cb) {
                return deleteMsgFromQueue(receiptHandleMsg, cb);
            }
        ], function (err, result) {
            if(err) {
                console.log("ERROR: " + err);
            } else {
                console.log("Whole job successfully done");
            }
            // Debug: Wait 30s to next polling msg
            // sleep.msleep(30000);
            return run();
        }
    );
}

function receive(cb) {

    console.log("Start polling");

    // Long polling (20s) set for whole queue - not for every msg
    var params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1
    };
    sqs.receiveMessage(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            return cb(err);
        }
        else {
            if(!data.hasOwnProperty("Messages")) {
                return cb("any msg to poll");
            }

            console.log("Msg received");
            var msgBody = JSON.parse(data.Messages[0].Body);
            var receiptHandle = data.Messages[0].ReceiptHandle;
            return cb(null, msgBody, receiptHandle);
        }
    });
}

function validateMsgBody(msgBody, cb) {
    if(!msgBody.hasOwnProperty("option") || !msgBody.hasOwnProperty("key")) {
        return cb("invalid msg body");
    }

    if(!_.includes(viableOptions, msgBody.option)) {
        return cb("invalid option");
    }
    return cb(null, msgBody);
}

function convertImage(msgBody, cb) {
    var imageLink = constructLink(msgBody.key);

    jimp.read(imageLink, function (err, image) {
        if (err) {
            return cb(err);
        }

        var extension = imageLink.split('.').pop();
        var convertedFileName =  moment() + "." + extension;

        switch (msgBody.option) {
            case "greyScale":
                image.greyscale();
                break;
            case "invert":
                image.invert();
                break;
            default:
                console.log("Case " + msgBody.operation + " doesn't exist");
        }
        console.log("File converted");

        image.write(convertedFileName, function () {
            console.log("File Saved");
            return cb(null, convertedFileName);
        });

    })
}

function saveConvertedImageInBucket(convertedFileName, cb) {

    var fileStream = fs.createReadStream(path.join( __dirname, convertedFileName));

    var params = {
        Bucket: bucketName,
        Key: "convertedImages/" + convertedFileName,
        ACL: "public-read",
        Body: fileStream
    };

    fileStream.on('error', function (err) {
        if (err) { return cb(err); }
    });
    fileStream.on('open', function () {
        s3.putObject(params, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                return cb(err);
            }
            else {
                console.log("Image saved in bucket");
                return cb(null, convertedFileName);
            }
        });
    });
}

function deleteLocalConvertedFile(convertedFileName, cb) {
    del([convertedFileName], function(err, deleted) {
        if (err) {
            return cb(err);
        }
        console.log("File deleted: " + deleted);
        return cb();
    });
}

function deleteMsgFromQueue(receiptHandleMsg, cb) {

    //TODO delete (debug only)
    // return cb(null, "Whole job successfully done");

    var params = {
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandleMsg
    };
    sqs.deleteMessage(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            return cb(err);
        }
        else {
            console.log("Msg deleted from queue");
            return cb();
        }
    });
}

// util function
function constructLink(key) {
    return  encodeURI("https://s3-us-west-2.amazonaws.com/" + bucketName + "/" + key);
}




