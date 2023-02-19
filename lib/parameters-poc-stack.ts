import { ArnFormat, CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { EndpointType, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
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
      timeout: Duration.seconds(10),
    });
    lambda.addLayers(
      LayerVersion.fromLayerVersionArn(
        this,
        'ssm-layer',
        Stack.of(this).formatArn({
          resource: 'layer',
          account: '590474943231',
          resourceName: 'AWS-Parameters-and-Secrets-Lambda-Extension:2',
          service: 'lambda',
          arnFormat: ArnFormat.COLON_RESOURCE_NAME,
        })
      )
    );

    lambda.role?.attachInlinePolicy(
      new Policy(this, 'service-discovery-policy', {
        statements: [
          new PolicyStatement({
            actions: ['ssm:GetParametersByPath', 'ssm:GetParameter'],
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
