var AWS = require("aws-sdk");
const sharedIni = require("@aws-sdk/shared-ini-file-loader");
const open = require("open");
const oidc = new AWS.SSOOIDC();
const sso = new AWS.SSO();
const fs = require("fs");
const path = require("path");
const sha1 = require("sha1");
const homeDir =
  process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
let options;
AWS.SingleSignOnCredentials = AWS.util.inherit(AWS.Credentials, {
  constructor: function SingleSignOnCredentials(options) {
    AWS.Credentials.call(this);
    this.options = options;
    this.get(function () {});
  },

  refresh: function refresh(callback) {
    const self = this;
    if (!callback) callback = AWS.util.fn.callback;

    if (!process || !process.env) {
      callback(
        AWS.util.error(
          new Error("No process info or environment variables available"),
          { code: "SingleSignOnCredentialsProviderFailure" }
        )
      );
      return;
    }
    options = options || {};
    const profile =
      (options && options.profile) || process.env.AWS_PROFILE || "default";

    sharedIni.loadSharedConfigFiles().then((files) => {
      const config = files.configFile[profile];
      AWS.config.update({ region: config.sso_region });
      const fileName = `${sha1(config.sso_start_url)}.json`;
      const cachedFile = fs.readFileSync(
        path.join(homeDir, ".aws", "sso", "cache", fileName)
      );
      const cacheObj = JSON.parse(cachedFile.toString());
      console.log(cacheObj);
      if (
        new Date().getTime() < Date.parse(cacheObj.expiresAt.replace("UTC", ""))
      ) {
        console.log("Using cached credentials");
        getRoleCredentials(cacheObj, config, self, callback);
        callback();
      } else {
        oidc
          .registerClient({
            clientName: options.clientName || "aws-sdk-js",
            clientType: "public",
          })
          .promise()
          .then((registration) => {
            oidc
              .startDeviceAuthorization({
                clientId: registration.clientId,
                clientSecret: registration.clientSecret,
                startUrl: config.sso_start_url,
              })
              .promise()
              .then((auth) => {
                open(auth.verificationUriComplete).then(() => {
                  console.log(`Waiting for token... Ctrl+C to cancel.`);
                  new Promise((resolve) => {
                    intervalId = setInterval(() => {
                      tokenResponse = createToken(registration, auth, resolve)
                        .then((p) => {
                          clearInterval(intervalId);
                          getRoleCredentials(p, config, self, callback);
                        })
                        .catch((err) => {});
                    }, auth.interval * 1000);
                  }).then((p) => {
                    console.log(p);
                  });
                });
                console.log(files);
              });
          });
      }
    });
  },
});

function getRoleCredentials(p, config, self, callback) {
    const request = {
        accessToken: p.accessToken,
        accountId: config.sso_account_id,
        roleName: config.sso_role_name,
    };
    return sso
        .getRoleCredentials(request)
        .promise()
        .then((credentials) => {
            setCredentials(self, credentials.roleCredentials, config);
            callback();
        })
}

function setCredentials(self, credentials, config) {
  self.expired = false;

  self.accessKeyId = credentials.accessKeyId;
  self.secretAccessKey = credentials.secretAccessKey;
  self.sessionToken = credentials.sessionToken;
  self.expireTime = credentials.expiration;
  AWS.config.update({ region: config.region });
}

function createToken(reg, auth) {
  try {
    return oidc
      .createToken({
        clientId: reg.clientId,
        clientSecret: reg.clientSecret,
        deviceCode: auth.deviceCode,
        grantType: "urn:ietf:params:oauth:grant-type:device_code",
      })
      .promise();
  } catch (err) {
    throw new Error("Waiting");
  }
}
