import * as AWS from "aws-sdk";
import { IniLoader, ParsedIniData } from "@aws-sdk/shared-ini-file-loader";
import { Credentials } from "aws-sdk/lib/credentials";

type provider = () => Credentials;

export module "aws-sdk" {
  export * as util from "aws-sdk/lib/util";
  export const util: {
    iniLoader: typeof IniLoader;
    inherit<C, F, R extends typeof C & typeof F>(
      klass: typeof C,
      features: typeof F
    ): InstanceType<R>;
    defaultProfile: string;
    getProfilesFromSharedConfig(iniLoader, filePath): ParsedIniData;
    error<E, O>(err: E, options?: O): E;
    fn: {
      noop: () => {};
      callback: (err) => {};
      makeAsync: (fn, expectedArgs) => (...args: any[]) => any;
    };
    update<T1, T2>(obj1: T1, obj2: T2): T1 & T2;
  };

  export class Credentials extends AWS.Credentials {
    protected coalesceRefresh(callback: (err) => void, sync?: boolean): void;
  }

  export interface SsoProfile {
    profile?: string;
    sso_region: string;
    sso_start_url: string;
    sso_role_name: string;
    sso_account_id: string;
  }

  export interface SsoCredentialsOptions {
    profile?: string;
    filename?: string;
  }

  export class SingleSignOnCredentials extends Credentials {
    constructor(options?: SsoCredentialsOptions);
    expired: boolean;
    load(callback: (err) => void): void;

    refresh(callback: (err) => void): void;
  }
}
