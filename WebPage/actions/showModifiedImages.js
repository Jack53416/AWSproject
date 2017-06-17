var util = require("util");
var helpers = require("../helpers");
var Policy = require("../s3post").Policy;
var S3Form = require("../s3post").S3Form;
var AWS_CONFIG_FILE = "config/aws-config.json";
var POLICY_FILE = "config/policy.json";
var TEMPLATE = "convertedImages.ejs";
var getImages = require("../s3getImages").getImages;

var task = function(request, callback){
	//1. load configuration
	var awsConfig = helpers.readJSONFile(AWS_CONFIG_FILE);
	var policyData = helpers.readJSONFile(POLICY_FILE);

	//2. prepare policy
	var policy = new Policy(policyData);

	//3. generate form fields for S3 POST
	var s3Form = new S3Form(policy);
	//4. get bucket name
	var bucketname = policy.getConditionValueByKey("bucket");

	var fields = s3Form.generateS3FormFields();

	fields = s3Form.addS3CredientalsFields(fields, awsConfig);

	getImages("convertedImages/",function(err,images){
		if(err)
		{
			return console.log(err);
		}
		callback(null, {template: TEMPLATE, params:{fields:fields, bucket:bucketname, images: images}});
	});

	
}

exports.action = task;