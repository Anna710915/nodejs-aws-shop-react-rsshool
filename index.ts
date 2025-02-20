import * as cdk from "aws-cdk-lib";
import { CdkStack } from "./static-site";

const app = new cdk.App();
new CdkStack(app, 'CdkStack');