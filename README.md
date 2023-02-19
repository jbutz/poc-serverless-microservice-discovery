# AWS Serverless Microservices Service Discovery Proof of Concept

Proof of Concept showing how you can use AWS Cloud Map or AWS Systems Manager Parameter Store to maintian details on deployed services and use it to dynamically reference resources.

## Setup

1. Ensure you have Node.js 18 installed on your machine
2. Ensure you have the [AWS CLI](https://aws.amazon.com/cli/) installed on your machine
3. Configure a terminal session with AWS programmatic credentials
4. Install this repo's dependencies
   ```bash
   npm ci
   ```
5. Run the CDK's boostrap command to ensure you AWS account is configured correctly
   ```bash
   npx cdk boostrap
   ```
6. Deploy the AWS resources
   ```bash
   npm run deploy
   ```
7. In the output look for `ssm-poc-service.ParameterStorePOCUrl` and `cloudmap-poc-service.CloudMapPOCUrl`, these URLs will retrieve the URLs for our two mock microservices and call the API and return the output
