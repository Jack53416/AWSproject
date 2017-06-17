var AWS = require("aws-sdk");
var _ = require("lodash");

var Policy = require("./s3post").Policy;
var helpers = require("./helpers");
var notificationHelper = require("./notificationHelper");

var policyData = helpers.readJSONFile("config/policy.json");

var policy = new Policy(policyData);
var bucketName = policy.getConditionValueByKey("bucket");

AWS.config.loadFromPath('config/aws-config.json');
var s3 = new AWS.S3();

exports.getImages = function(prefix, callback){
    var params = {
        Bucket: bucketName,
        Prefix: prefix,
        Marker: prefix,
        MaxKeys: 50
    };

    s3.listObjects(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            return notificationHelper.showError(err, callback);
        }
        else {
            var imagesKeys = _.map(data.Contents, 'Key');
            var images = _.map(imagesKeys, function (key) {
                return {
                    key: key,
                    link: "https://s3-us-west-2.amazonaws.com/" + bucketName + "/" + key
                }
            });
            return callback(null,images);
        }
    });

};

