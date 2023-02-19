import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import {
  DiscoveryType,
  HttpNamespace,
  Service,
} from 'aws-cdk-lib/aws-servicediscovery';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { MockMicroservice } from './constructs/mock-microservice';

export type MockServiceProps = StackProps & {
  serviceName: string;
  sharedNamespace: {
    name: string;
    id: string;
    arn: string;
  };
};

export class MockServiceStack extends Stack {
  public readonly serviceName: string;
  private readonly service: MockMicroservice;
  appName = 'discovery-poc';

  constructor(scope: Construct, id: string, props: MockServiceProps) {
    super(scope, id, props);
    this.serviceName = props.serviceName;
    this.service = new MockMicroservice(this, 'service');

    this.setupCloudMap(props.sharedNamespace, props.serviceName);
    this.setupParameterStore(this.appName, props.serviceName);

    Tags.of(scope).add('app', this.appName);
    Tags.of(scope).add('app_service', props.serviceName);
  }

  private getServiceInfo() {
    return {
      type: 'AWS::ApiGateway::RestApi',
      arn: Stack.of(this).formatArn({
        service: 'apigateway',
        account: '',
        resource: 'restapis',
        resourceName: this.service.apiGateway.restApiId,
      }),
      url: `https://${this.service.apiGateway.restApiId}.execute-api.${
        Stack.of(this).region
      }.${Stack.of(this).urlSuffix}/${
        this.service.apiGateway.deploymentStage.stageName
      }`,
    };
  }

  private setupCloudMap(
    sharedNamespace: {
      name: string;
      id: string;
      arn: string;
    },
    serviceName: string
  ) {
    // Cloud Map Specific Implementation
    const namespace = HttpNamespace.fromHttpNamespaceAttributes(
      this,
      'namespace',
      {
        namespaceArn: sharedNamespace.arn,
        namespaceId: sharedNamespace.id,
        namespaceName: sharedNamespace.name,
      }
    );
    const serviceRegistration = new Service(this, 'service-registration', {
      namespace,
      name: serviceName,
      discoveryType: DiscoveryType.API,
    });

    serviceRegistration.registerNonIpInstance('service-registration-instance', {
      customAttributes: this.getServiceInfo(),
    });
  }

  private setupParameterStore(appName: string, serviceName: string) {
    new StringParameter(this, 'url-parameter', {
      stringValue: this.getServiceInfo().url,
      parameterName: `/${appName}/${serviceName}`,
    });
  }
}
