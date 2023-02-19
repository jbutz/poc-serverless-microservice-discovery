#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { MockServiceStack } from '../lib/mock-app-stack';
import { CloudMapProofOfConceptStack } from '../lib/cloudmap-poc-stack';
import { SharedInfrastructureStack } from '../lib/shared-infrastructure';
import { ParameterStoreProofOfConceptStack } from '../lib/parameters-poc-stack';

const app = new cdk.App({});

const sharedInfrastructure = new SharedInfrastructureStack(
  app,
  'shared-infrastructure',
  {
    namespace: 'poc-app',
  }
);

const mockServiceOne = new MockServiceStack(app, 'service-one', {
  serviceName: 'service-one',
  sharedNamespace: {
    arn: sharedInfrastructure.namespace.namespaceArn,
    id: sharedInfrastructure.namespace.namespaceId,
    name: sharedInfrastructure.namespace.namespaceName,
  },
});
mockServiceOne.addDependency(sharedInfrastructure);

const mockServiceTwo = new MockServiceStack(app, 'service-two', {
  serviceName: 'service-two',
  sharedNamespace: {
    arn: sharedInfrastructure.namespace.namespaceArn,
    id: sharedInfrastructure.namespace.namespaceId,
    name: sharedInfrastructure.namespace.namespaceName,
  },
});
mockServiceTwo.addDependency(sharedInfrastructure);

const cloudMapPOCService = new CloudMapProofOfConceptStack(
  app,
  'cloudmap-poc-service',
  {
    namespace: sharedInfrastructure.namespace.namespaceName,
    serviceOneName: mockServiceOne.serviceName,
    serviceTwoName: mockServiceTwo.serviceName,
  }
);
cloudMapPOCService.addDependency(sharedInfrastructure);
cloudMapPOCService.addDependency(mockServiceOne);
cloudMapPOCService.addDependency(mockServiceTwo);

const parameterStorePOCService = new ParameterStoreProofOfConceptStack(
  app,
  'ssm-poc-service',
  {
    serviceOneName: mockServiceOne.serviceName,
    serviceTwoName: mockServiceTwo.serviceName,
  }
);
parameterStorePOCService.addDependency(sharedInfrastructure);
parameterStorePOCService.addDependency(mockServiceOne);
parameterStorePOCService.addDependency(mockServiceTwo);
