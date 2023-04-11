import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// @see https://dev.classmethod.jp/articles/create-resources-used-for-oidc-integration-with-github-with-aws-cdk/
export const createGhaDeployResources = ({
  construct,
  principalFederatedSub,
  imagesBucket,
  usersTable,
}: {
  construct: Construct;
  principalFederatedSub: string;
  imagesBucket: cdk.aws_s3.Bucket;
  usersTable: cdk.aws_dynamodb.Table;
}): void => {
  const gitHubIdProvider = new cdk.aws_iam.OpenIdConnectProvider(
    construct,
    'GitHubIdProvider',
    {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    }
  );

  const oidcDeployRole = new cdk.aws_iam.Role(construct, 'GitHubOidcRole', {
    roleName: 'github-oidc-role',
    assumedBy: new cdk.aws_iam.FederatedPrincipal(
      gitHubIdProvider.openIdConnectProviderArn,
      {
        StringLike: {
          'token.actions.githubusercontent.com:sub': principalFederatedSub,
        },
      },
      'sts:AssumeRoleWithWebIdentity' // これを忘れるとStatementのActionが'sts:AssumeRole'となりOIDCでのAssumeRoleで使えなくなる。
    ),
  });

  const administratorAccessPolicyStatement = new cdk.aws_iam.PolicyStatement({
    effect: cdk.aws_iam.Effect.ALLOW,
    actions: ['*'],
    resources: ['*'],
  });

  const deployPolicy = new cdk.aws_iam.Policy(construct, 'deployPolicy', {
    policyName: 'deployPolicy',
    statements: [
      administratorAccessPolicyStatement,
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.DENY,
        actions: [
          'dynamodb:BatchGetItem',
          'dynamodb:ConditionCheckItem',
          'dynamodb:PartiQLSelect',
          'dynamodb:GetItem',
          'dynamodb:Scan',
          'dynamodb:Query',
        ],
        resources: [usersTable.tableArn],
      }),
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.DENY,
        actions: ['s3:GetObject*'],
        resources: [imagesBucket.arnForObjects('*')],
      }),
    ],
  });

  oidcDeployRole.attachInlinePolicy(deployPolicy);
};
