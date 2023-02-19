import { ArnFormat, Stack } from 'aws-cdk-lib';
import { LayerVersion, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class InstrumentedNodeFunction extends NodejsFunction {
  constructor(scope: Construct, id: string, props: NodejsFunctionProps) {
    super(scope, id, {
      runtime: Runtime.NODEJS_18_X,
      tracing: Tracing.ACTIVE,
      bundling: {
        externalModules: [
          '@aws-sdk/*',
          '@aws-lambda-powertools/commons',
          '@aws-lambda-powertools/logger',
          '@aws-lambda-powertools/metrics',
          '@aws-lambda-powertools/tracer',
        ],
      },
      logRetention: RetentionDays.ONE_DAY,
      ...props,
    });

    const powertoolsLayer = LayerVersion.fromLayerVersionArn(
      this,
      'PowertoolsLayer',
      Stack.of(this).formatArn({
        resource: 'layer',
        account: '094274105915',
        resourceName: 'AWSLambdaPowertoolsTypeScript:7',
        service: 'lambda',
        arnFormat: ArnFormat.COLON_RESOURCE_NAME,
      })
    );

    this.addLayers(powertoolsLayer);
  }
}
