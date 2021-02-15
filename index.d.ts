import { Credentials } from 'aws-sdk/lib/credentials';
export class SingleSignOnCredentials extends Credentials {
    /**
     * Creates a new SingleSignOnCredentials object.
     */
    constructor(options?: SingleSignOnCredentialsOptions);
}

interface SingleSignOnCredentialsOptions {
    profile?: string
    filename?: string
}
