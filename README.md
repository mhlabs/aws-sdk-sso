# aws-sdk-sso

SingleSignOnCredentials provider aws-sdk-js.

## Usage
```
const AWS = require("aws-sdk");
const awsSsoProvider = require("aws-sdk-sso");

AWS.config.credentialProvider.providers.push(
    new awsSsoProvider.SingleSignOnCredentials()
);
``` 

