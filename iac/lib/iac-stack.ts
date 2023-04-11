import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { createDdbTables } from './ddb-table';
import { createGhaDeployResources } from './gha-deploy';
import { createS3Buckets } from './s3-bucket';

export class IacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accountId = this.account;

    createS3Buckets({ construct: this, accountId });
    createDdbTables({ construct: this });
    createGhaDeployResources({
      construct: this,
      principalFederatedSub: 'repo:tanimon/gha-playground:ref:refs/heads/*',
    });
  }
}
