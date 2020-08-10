var AWS = require("aws-sdk");
const sharedIni = require("@aws-sdk/shared-ini-file-loader");
const open = require("open");
const oidc = new AWS.SSOOIDC();
const sso = new AWS.SSO();
const sts = new AWS.STS();
const fs = require("fs");
const path = require("path");
const sha1 = require("sha1");
const { setUncaughtExceptionCaptureCallback } = require("process");
let authInProgress = false;
const homeDir =
  process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
let options;
AWS.SingleSignOnCredentials = AWS.util.inherit(AWS.Credentials, {
  constructor: function SingleSignOnCredentials(options) {
    AWS.Credentials.call(this);
    this.options = options;
    this.get(function () {});
  },

  async refresh(callback) {
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
    this.options = this.options || {};
    const profile =
      (this.options && this.options.profile) || process.env.AWS_PROFILE || "default";

    const files = await sharedIni.loadSharedConfigFiles();
    const config = files.configFile[profile];
    AWS.config.update({ region: config.sso_region });
    const fileName = `${sha1(
      config.sso_start_url + (this.options.profile ? `|${this.options.profile}` : "")
    )}.json`;

    const cachePath = path.join(homeDir, ".aws", "sso", "cache", fileName);
    let cacheObj = null;
    if (fs.existsSync(cachePath)) {
      const cachedFile = fs.readFileSync(cachePath);
      cacheObj = JSON.parse(cachedFile.toString());
    }
    if (
      cacheObj &&
      new Date().getTime() < Date.parse(cacheObj.expiresAt.replace("UTC", ""))
    ) {
      await getRoleCredentials(cacheObj, config, self, fileName);      
    } else {
      await ssoAuth(config, self, fileName);
    }
},
});

async function ssoAuth(config, self, fileName) {
  console.log("The SSO session associated with this profile has expired or is otherwise invalid. To refresh this SSO session run aws sso login with the corresponding profile.");
  process.exit(1);
  return;

  // work in progress:
  if (!authInProgress) {
    authInProgress = true;
    const registration = await oidc
      .registerClient({
        clientName: this.options.clientName || "aws-sdk-js",
        clientType: "public",
      })
      .promise();
    const auth = await oidc
      .startDeviceAuthorization({
        clientId: registration.clientId,
        clientSecret: registration.clientSecret,
        startUrl: config.sso_start_url,
      })
      .promise();

    await open(auth.verificationUriComplete);
    console.log(`Waiting for token... Ctrl+C to cancel.`);
    await new Promise((resolve) => {
      intervalId = setInterval(async () => {
        tokenResponse = await createToken(registration, auth, resolve)
          .then(async (p) => {
            // saveCache(p);
            clearInterval(intervalId);
            await getRoleCredentials(p, config, self, fileName);
          })
          .catch((err) => { });
      }, auth.interval * 1000);
    });
  }
}

async function getRoleCredentials(token, config, self, fileName) {
  const request = {
    accessToken: token.accessToken,
    accountId: config.sso_account_id,
    roleName: config.sso_role_name,
  };
  const credentials = await sso.getRoleCredentials(request).promise();  
  setCredentials(self, credentials.roleCredentials, config);
//  setCache(token, config, credentials, fileName);
}

function setCache(token, config, credentials, fileName) {
  try {
  fs.writeFileSync(fileName, JSON.stringify({
    startUrl: config.sso_start_url,
    region: config.region,
    accessToken: token.accessToken,
    expiresAt: new Date(new Date().getTime() + parseInt(credentials.expiresIn)).toISOString()
  }))
  } catch(err) {
    console.log(err);
  }
}

function setCredentials(self, credentials, config) {
  self.expired = false;

  self.accessKeyId = credentials.accessKeyId;
  self.secretAccessKey = credentials.secretAccessKey;
  self.sessionToken = credentials.sessionToken;
  self.expireTime = credentials.expiration;
  AWS.config.update({ region: config.region });
}

async function createToken(reg, auth) {
  try {
    return await oidc
      .createToken({
        clientId: reg.clientId,
        clientSecret: reg.clientSecret,
        deviceCode: auth.deviceCode,
        grantType: "urn:ietf:params:oauth:grant-type:device_code",
      })
      .promise();
  } catch (err) {
    console.log("Waiting...");
  }
}
