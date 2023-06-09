import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface CreateDdbTablesResult {
  usersTable: cdk.aws_dynamodb.Table;
}

export const createDdbTables = ({
  construct,
}: {
  construct: Construct;
}): CreateDdbTablesResult => {
  const usersTable = new cdk.aws_dynamodb.Table(construct, 'usersTable', {
    tableName: 'users',
    partitionKey: {
      name: 'id',
      type: cdk.aws_dynamodb.AttributeType.STRING,
    },
    pointInTimeRecovery: true,
    billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: cdk.RemovalPolicy.RETAIN,
  });

  return { usersTable };
};
