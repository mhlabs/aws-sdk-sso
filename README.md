# DEPRECATED. Sam-cli supports AWS SSO authentication since [v1.1.0](https://github.com/aws/aws-sam-cli/releases/tag/v1.1.0) via the upgrade of boto3

# aws-sdk-sso

SingleSignOnCredentials provider aws-sdk-js.

## Usage
```
const AWS = require("aws-sdk");
require("aws-sdk-sso");

AWS.config.credentialProvider.providers.push(
    new AWS.SingleSignOnCredentials()
);
``` 

## Known issues
Does not yet support browser redirect login. Please use 'aws sso login` first. This is in lieu of official support form AWS and shouldn't be used for cruical tasks.
