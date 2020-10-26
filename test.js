const AWS = require("aws-sdk");
const ssc = require("./index.js");

AWS.config.update({ credentials: new AWS.SingleSignOnCredentials() });

const sts = new AWS.STS();

describe("JavaScript Test with SingleSignOnCredentials", () => {
  test("STS GetCallerIdentity", async () => {
    const callerIdentity = await sts.getCallerIdentity().promise();
    expect(callerIdentity).toBeDefined();
    expect(callerIdentity).toHaveProperty("Arn");
    expect(callerIdentity.Arn).toBeDefined();
    expect(callerIdentity).toHaveProperty("Account");
    expect(callerIdentity.Account).toBeDefined();
    expect(/^arn:aws:sts::/.test(callerIdentity.Arn)).toBe(true);
  });
});
