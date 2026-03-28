const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AKIARQYIGKTLTDPNOI4B,
  secretAccessKey: process.env.R6bYmAQDO6FayTPrc2F7EGwsHgp53K4Rm+vVCW9e
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
module.exports = dynamoDB;