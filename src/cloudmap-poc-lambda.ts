import { injectLambdaContext, Logger } from '@aws-lambda-powertools/logger';
import { captureLambdaHandler, Tracer } from '@aws-lambda-powertools/tracer';
import {
  DiscoverInstancesCommand,
  ServiceDiscoveryClient,
} from '@aws-sdk/client-servicediscovery';
import middy from '@middy/core';
const tracer = new Tracer({});
const logger = new Logger({});

let serviceDiscoveryClient: ServiceDiscoveryClient;

async function lambdaHandler(event: unknown) {
  serviceDiscoveryClient =
    serviceDiscoveryClient ||
    tracer.captureAWSv3Client(new ServiceDiscoveryClient({}));

  const [serviceOneResults, serviceTwoResults] = await Promise.all([
    testServiceDiscovery(
      serviceDiscoveryClient,
      process.env.CLOUDMAP_NAMESPACE!,
      process.env.CLOUDMAP_SERVICE_ONE_NAME!
    ),
    testServiceDiscovery(
      serviceDiscoveryClient,
      process.env.CLOUDMAP_NAMESPACE!,
      process.env.CLOUDMAP_SERVICE_TWO_NAME!
    ),
  ]);

  return {
    statusCode: 200,
    body: JSON.stringify({
      serviceOneResults,
      serviceTwoResults,
    }),
  };
}

async function testServiceDiscovery(
  client: ServiceDiscoveryClient,
  namespaceName: string,
  serviceName: string
) {
  const discoveryResp = await client.send(
    new DiscoverInstancesCommand({
      NamespaceName: namespaceName,
      ServiceName: serviceName,
    })
  );

  const instance = (discoveryResp.Instances || []).find(
    (i) => (i.Attributes || {}).type === 'AWS::ApiGateway::RestApi'
  );

  if (!instance) {
    logger.error('Missing Mock Service', {
      namespaceName,
      serviceName,
      clientResponse: discoveryResp,
    });
    throw new Error(`No instances returned for ${serviceName}`);
  }

  const apiUrl = `${instance.Attributes!.url}/hello-world`;

  const apiResp = await fetch(apiUrl, {
    method: 'GET',
  });

  return {
    apiUrl,
    statusCode: apiResp.status,
    statusText: apiResp.statusText,
    headers: apiResp.headers,
    body: await apiResp.json(),
  };
}

export const handler = middy(lambdaHandler)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer));
