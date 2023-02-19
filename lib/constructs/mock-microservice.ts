import {
  EndpointType,
  HttpIntegration,
  IRestApi, RestApi
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export type MockMicroserviceProps = {};


export class MockMicroservice extends Construct {
  public apiGateway: IRestApi;
  constructor(scope: Construct, id: string, props?: MockMicroserviceProps) {
    super(scope, id);

    this.apiGateway = new RestApi(this, 'api', {
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: 'poc',
      },
    });

    this.apiGateway.root
      .addProxy({
        anyMethod: false,
      })
      .addMethod(
        'GET',
        new HttpIntegration('https://catfact.ninja/fact', {
          httpMethod: 'GET',
        })
      );
  }
}
