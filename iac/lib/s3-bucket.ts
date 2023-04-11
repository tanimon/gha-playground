import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface CreateS3BucketsResult {
  imagesBucket: cdk.aws_s3.Bucket;
}

export const createS3Buckets = ({
  construct,
  accountId,
}: {
  construct: Construct;
  accountId: string;
}): CreateS3BucketsResult => {
  const imagesBucket = new cdk.aws_s3.Bucket(construct, 'imagesBucket', {
    bucketName: `${accountId}-images`, // S3バケット名は大文字禁止のためケバブケース
    blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
    encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
  });

  return { imagesBucket };
};
