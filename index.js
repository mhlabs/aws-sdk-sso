const AWS = require("aws-sdk");
const os = require("os");
const fs = require("fs");
const path = require("path");
const sha1 = require("sha1");

var iniLoader = AWS.util.iniLoader;

AWS.SingleSignOnCredentials = AWS.util.inherit(AWS.Credentials, {
  constructor: function SingleSignOnCredentials(options) {
    AWS.Credentials.call(this);

    options = options || {};

    this.filename = options.filename;
    process.env.AWS_PROFILE =
      options.profile || process.env.AWS_PROFILE || AWS.util.defaultProfile;
  },

  /**
   * @api private
   */
  load: function load(callback) {
    var self = this;
    const profileName = process.env.AWS_PROFILE;
    try {
      const filepath =
        process.env.AWS_CONFIG_FILE ||
        path.join(os.homedir(), ".aws", "config");
      var profiles = AWS.util.getProfilesFromSharedConfig(iniLoader, filepath);
      var profile = profiles[profileName] || {};      

      if (Object.keys(profile).length === 0) {
        throw AWS.util.error(
          new Error("Profile " + profileName + " not found"),
          { code: "ProcessCredentialsProviderFailure" }
        );
      }
      AWS.config.update({ region: profile.sso_region });
      const sso = new AWS.SSO();
      if (!profile.sso_start_url) {
        callback(new Error("No sso_start_url"));
        return;
      }

      const fileName = `${sha1(profile.sso_start_url)}.json`;

      const cachePath = path.join(
        os.homedir(),
        ".aws",
        "sso",
        "cache",
        fileName
      );
      let cacheObj = null;
      if (fs.existsSync(cachePath)) {
        const cachedFile = fs.readFileSync(cachePath);
        cacheObj = JSON.parse(cachedFile.toString());
      }

      if (!cacheObj) {
        throw AWS.util.error(
          new Error(
            `Cached credentials not found under ${cachePath}. Please make sure you log in with 'aws sso login' first`
          )
        );
      }

      const request = {
        accessToken: cacheObj.accessToken,
        accountId: profile.sso_account_id,
        roleName: profile.sso_role_name,
      };
      sso.getRoleCredentials(request, (err, c) => {
        if (!c) {
          console.log(err.message);
          console.log("Please log in using 'aws sso login'");
        }
        self.expired = false;
        AWS.util.update(self, {
          accessKeyId: c.roleCredentials.accessKeyId,
          secretAccessKey: c.roleCredentials.secretAccessKey,
          sessionToken: c.roleCredentials.sessionToken,
          expireTime: new Date(c.roleCredentials.expiration),
        });
        this.coalesceRefresh(callback || AWS.util.fn.callback);
        callback(null);
      });
    } catch (err) {
      console.log(err);
      callback(err);
    }
  },

  /**
   * Loads the credentials from the credential process
   *
   * @callback callback function(err)
   *   Called after the credential process has been executed. When this
   *   callback is called with no error, it means that the credentials
   *   information has been loaded into the object (as the `accessKeyId`,
   *   `secretAccessKey`, and `sessionToken` properties).
   *   @param err [Error] if an error occurred, this value will be filled
   * @see get
   */
  refresh: function refresh(callback) {
    iniLoader.clearCachedFiles();
    this.coalesceRefresh(callback || AWS.util.fn.callback);
  },
});
