const AWS = require("aws-sdk");
const ssc = require("./index.js");

async function test() {
  AWS.config.credentialProvider.providers.push(
    new AWS.SingleSignOnCredentials()
  );

  const s3 = new AWS.S3();
  const buckets = await s3.listBuckets().promise();
  console.log(buckets.Buckets);
}

test()
  .then((err) => console.log(err))
  .catch((err) => console.log(err));
