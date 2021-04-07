const AWS = require('aws-sdk');
const os = require('os');
const fs = require('fs');
const path = require('path');
const sha1 = require('sha1');

var iniLoader = AWS.util.iniLoader;

exports.SingleSignOnCredentials = AWS.SingleSignOnCredentials = AWS.util.inherit(AWS.Credentials, {
  /**
   * Creates a new SingleSignOnCredentials object.
   *
   * @param options [map] a set of options
   * @option options profile [String] (AWS_PROFILE env var or 'default')
   *   the name of the profile to load.
   * @option options filename [String] ('~/.aws/credentials' or defined by
   *   AWS_SHARED_CREDENTIALS_FILE process env var)
   *   the filename to use when loading credentials.
   * @option options callback [Function] (err) Credentials are eagerly loaded
   *   by the constructor. When the callback is called with no error, the
   *   credentials have been loaded successfully.
   */
  constructor: function SingleSignOnCredentials(options) {
    AWS.Credentials.call(this);

    options = options || {};

    this.filename = options.filename;
    this.profile = options.profile || process.env.AWS_PROFILE || AWS.util.defaultProfile;
    this.get(options.callback || AWS.util.fn.noop);
  },

  /**
   * @api private
   */
  load: function load(callback) {
    var self = this;
    try {
      var profiles = AWS.util.getProfilesFromSharedConfig(iniLoader, this.filename);
      var profile = profiles[this.profile] || {};

      if (Object.keys(profile).length === 0) {
        throw Error(`Profile ${this.profile} not found`);
      }
      if (!profile.sso_start_url) {
        callback(AWS.util.error(
          new Error(`No sso_start_url set for profile ${this.profile}`),
          { code: 'SingleSignOnCredentialsProviderFailure'}
        ), null);
        return;
      }
      AWS.config.update({ region: profile.sso_region });
      const sso = new AWS.SSO();

      const fileName = `${sha1(profile.sso_start_url)}.json`;

      const cachePath = path.join(
        os.homedir(),
        '.aws',
        'sso',
        'cache',
        fileName
      );
      let cacheObj = null;
      if (fs.existsSync(cachePath)) {
        const cachedFile = fs.readFileSync(cachePath);
        cacheObj = JSON.parse(cachedFile.toString());
      }

      if (!cacheObj) {
        throw Error(
          `Cached credentials not found under ${cachePath}. Please make sure you log in with 'aws sso login' first`
        );
      }

      const request = {
        accessToken: cacheObj.accessToken,
        accountId: profile.sso_account_id,
        roleName: profile.sso_role_name,
      };
      sso.getRoleCredentials(request, (err, c) => {
        if (err || !c) {
          console.log(err)
          callback(AWS.util.error(
            new Error(err?.message || 'Please log in using "aws sso login"'),
            { code: 'SingleSignOnCredentialsProviderFailure'}
          ), null);
          return;
        }
        self.expired = false;
        AWS.util.update(self, {
          accessKeyId: c.roleCredentials.accessKeyId,
          secretAccessKey: c.roleCredentials.secretAccessKey,
          sessionToken: c.roleCredentials.sessionToken,
          expireTime: new Date(c.roleCredentials.expiration),
        });
        callback(null);
      });
    } catch (err) {
      console.log(err);
      callback(AWS.util.error(
        new Error(err.message),
        { code: 'SingleSignOnCredentialsProviderFailure'}
      ), null);
    }
  },

  /**
   * Loads the credentials from the AWS SSO process
   *
   * @callback callback function(err)
   *   Called after the AWS SSO process has been executed. When this
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
