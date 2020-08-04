const AWS = require("aws-sdk");
const ssc = require("./index.js");

async function test() {
    AWS.config.credentialProvider.providers.push(new AWS.SingleSignOnCredentials( {profile: "test"}));

    const s3 = new AWS.S3();
    const buckets = await s3.listBuckets().promise();
    console.log(buckets.Buckets);
};

test();