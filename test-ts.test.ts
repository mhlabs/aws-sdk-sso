import AWS from "aws-sdk";
import "./index";
import { SingleSignOnCredentials } from "aws-sdk";

describe("TypeScript Test with SingleSignOnCredentials", () => {
  test("TypeScript Static Definitions", async () => {
    expect(AWS).toHaveProperty("SingleSignOnCredentials");
    const sso = new AWS.SingleSignOnCredentials();
    expect(sso).toBeDefined();
    expect(sso).toHaveProperty("expired");
    expect(sso).toHaveProperty("accessKeyId");
    expect(sso.accessKeyId).toBeUndefined();
    expect(sso).toHaveProperty("sessionToken");
    expect(sso.sessionToken).toBeUndefined();
    await sso.refreshPromise();

    expect(sso).toHaveProperty("accessKeyId");
    expect(sso.accessKeyId).toBeDefined();
    expect(sso).toHaveProperty("sessionToken");
    expect(sso.sessionToken).toBeDefined();
  });
  test("STS GetCallerIdentity", async () => {
    AWS.config.update({ credentials: new AWS.SingleSignOnCredentials() });
    const sts = new AWS.STS();
    const callerIdentity = await sts.getCallerIdentity().promise();
    expect(callerIdentity).toBeDefined();
    expect(callerIdentity).toHaveProperty("Arn");
    expect(callerIdentity.Arn).toBeDefined();
    expect(callerIdentity).toHaveProperty("Account");
    expect(callerIdentity.Account).toBeDefined();
    expect(/^arn:aws:sts::/.test(callerIdentity.Arn)).toBe(true);
  });
});
