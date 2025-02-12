import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontorigins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, "cloudfrontOAI");
    
        // Create an S3 bucket with website hosting enabled
        const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
          bucketName: 'auto-shop-bucket',
          websiteIndexDocument: 'index.html',
          publicReadAccess: false,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, 
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteObjects: true
        });

        // Add a policy to allow CloudFront to access the S3 bucket via OAI
        websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
            actions: ["s3:GetObject"],
            resources: [websiteBucket.arnForObjects("*")],
            principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
        }));

        // Create CloudFront distribution pointing to the S3 bucket
        const distribution = new cloudfront.Distribution(this, "WebsiteDistribution", {
            defaultRootObject: "index.html",
            defaultBehavior: { 
                origin: cloudfrontorigins.S3BucketOrigin.withOriginAccessIdentity(websiteBucket, {
                    originAccessIdentity: cloudfrontOAI
                })                
            },
        });

        // Deploy website content and invalidate CloudFront cache
        new s3deploy.BucketDeployment(this, "DeployWebsite", {
            sources: [s3deploy.Source.asset("./dist")],
            destinationBucket: websiteBucket,
            distribution: distribution,
            distributionPaths: ["/*"], // Auto-invalidate CloudFront cache
        });
      }
}