import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { EndpointType, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { InstrumentedNodeFunction } from './constructs/instrumented-node-function';

export type CloudMapProofOfConceptStackProps = StackProps & {
  namespace: string;
  serviceOneName: string;
  serviceTwoName: string;
};

export class CloudMapProofOfConceptStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: CloudMapProofOfConceptStackProps
  ) {
    super(scope, id, props);

    const lambda = new InstrumentedNodeFunction(this, 'poc-lambda', {
      environment: {
        service: 'service-discovery-poc',
        CLOUDMAP_NAMESPACE: props.namespace,
        CLOUDMAP_SERVICE_ONE_NAME: props.serviceOneName,
        CLOUDMAP_SERVICE_TWO_NAME: props.serviceTwoName,
      },
      entry: 'src/cloudmap-poc-lambda.ts',
    });

    lambda.role?.attachInlinePolicy(
      new Policy(this, 'service-discovery-policy', {
        statements: [
          new PolicyStatement({
            actions: ['servicediscovery:DiscoverInstances'],
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

    new CfnOutput(this, 'CloudMapPOCUrl', {
      value: api.url,
    });
  }
}
