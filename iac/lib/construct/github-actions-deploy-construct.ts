import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface GithubActionsDeployConstructProps {
  repositoryOwner: string;
  repositoryName: string;
}

export class GithubActionsDeployConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: GithubActionsDeployConstructProps
  ) {
    super(scope, id);

    const githubIdProvider = new cdk.aws_iam.OpenIdConnectProvider(
      this,
      'githubIdProvider',
      {
        url: 'https://token.actions.githubusercontent.com',
        clientIds: ['sts.amazonaws.com'],
      }
    );

    const githubActionsDeployRole = new cdk.aws_iam.Role(
      this,
      'githubActionsDeployRole',
      {
        roleName: 'githubActionsDeployRole',
        assumedBy: new cdk.aws_iam.FederatedPrincipal(
          githubIdProvider.openIdConnectProviderArn,
          {
            StringLike: {
              'token.actions.githubusercontent.com:sub': `repo:${props.repositoryOwner}/${props.repositoryName}:ref:refs/heads/*`,
            },
          }
        ),
      }
    );

    const deployPolicy = new cdk.aws_iam.Policy(this, 'deployPolicy', {
      policyName: 'deployPolicy',
      statements: [
        // TODO: 必要に応じて権限を減らす
        // AdministratorAccess 相当
        new cdk.aws_iam.PolicyStatement({
          effect: cdk.aws_iam.Effect.ALLOW,
          actions: ['*'],
          resources: ['*'],
        }),
      ],
    });
    githubActionsDeployRole.attachInlinePolicy(deployPolicy);
  }
}
