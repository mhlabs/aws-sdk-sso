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