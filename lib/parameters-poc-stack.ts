import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { EndpointType, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { InstrumentedNodeFunction } from './constructs/instrumented-node-function';

export type ParameterStoreProofOfConceptStackProps = StackProps & {
  serviceOneName: string;
  serviceTwoName: string;
};

export class ParameterStoreProofOfConceptStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ParameterStoreProofOfConceptStackProps
  ) {
    super(scope, id, props);

    const lambda = new InstrumentedNodeFunction(this, 'poc-lambda', {
      environment: {
        service: 'service-discovery-poc',
        PARAMETER_NAMESPACE: 'discovery-poc',
        PARAMETER_SERVICE_ONE_NAME: props.serviceOneName,
        PARAMETER_SERVICE_TWO_NAME: props.serviceTwoName,
      },
      entry: 'src/parameters-poc-lambda.ts',
    });

    lambda.role?.attachInlinePolicy(
      new Policy(this, 'service-discovery-policy', {
        statements: [
          new PolicyStatement({
            actions: ['ssm:GetParametersByPath'],
            resources: ['*'],
            effect: Effect.ALLOW,
          }),
        ],
      })
    );

    const api = new LambdaRestApi(this, 'api', {
      restApiName: 'poc-api',
      handler: lambda,
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
    });

    new CfnOutput(this, 'ParameterStorePOCUrl', {
      value: api.url,
    });
  }
}
