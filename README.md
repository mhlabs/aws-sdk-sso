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

