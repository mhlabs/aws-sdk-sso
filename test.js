const AWS = require("aws-sdk");
const ssc = require("./index.js");

const sha = require("sha1");

//AWS.config.credentialProvider.providers.push(new AWS.SingleSignOnCredentials());
AWS.config.update({ credentials: new AWS.SingleSignOnCredentials() });
const s3 = new AWS.S3();

async function test() {
  const buckets = await s3.listBuckets().promise();
  console.log(buckets.Buckets);
}
test();
