import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
// Import the Lambda module
import { Code, Function, Runtime, FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import {
  RestApi, DomainName, BasePathMapping, ApiKey, UsagePlan, LambdaRestApi
} from 'aws-cdk-lib/aws-apigateway';

const SSL_CERTIFICATE_ARN =  "arn:aws:acm:af-south-1:123456788000:certificate/12abcde1-1200-3400-5600-d12c12345678"
const DOMAIN_NAME = 'docreds.dev';
const API_STAGE_NAME = 'dev';

export class HelloCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'HelloCdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // Define the Lambda function resource
    const myFunction = new Function(this, "HelloWorldFunction", {
      runtime: Runtime.NODEJS_20_X, // Provide any supported Node.js runtime
      code: Code.fromAsset("lambda"), // code loaded from "lambda" directory
      handler: "hello.handler", // file is "hello", function is "handler"
    })

    // Define the Lambda function URL resource
    const myFunctionUrl = myFunction.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    });

    // Define a CloudFormation output for your URL
    new cdk.CfnOutput(this, "myFunctionUrlOutput", {
      value: myFunctionUrl.url,
    })

    // Define the API Gateway resource
    const gateway = new LambdaRestApi(this, "HelloWorldGateway", {
      handler: myFunction
    });

    // https://nanosoft.co.za/blog/post/aws-api-gateway-custom-domain-cdk
    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', SSL_CERTIFICATE_ARN);
    const domainName = new DomainName(this, 'HelloCdkDomainName', {
      domainName: DOMAIN_NAME,
      certificate: certificate
    });

    const api = new RestApi(this, 'HelloCdkApi', {
      deployOptions: {
        stageName: API_STAGE_NAME
      }
    });
    new BasePathMapping(this, 'HelloCdkBasePathMapping', {
      domainName: domainName,
      restApi: api
    });

    const plan = new UsagePlan(this, 'HelloCdkUsagePlan', {
      apiStages: [
        {
          api: api,
          stage: api.deploymentStage
        }
      ]
    });

    const key = new ApiKey(this, 'HelloCdkApiKey', {
      description: 'API Key for HelloCdkApi'
    });
    plan.addApiKey(key);
  }
}
