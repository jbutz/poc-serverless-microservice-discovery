import { injectLambdaContext, Logger } from '@aws-lambda-powertools/logger';
import { captureLambdaHandler, Tracer } from '@aws-lambda-powertools/tracer';
import { GetParametersByPathCommand, SSMClient } from '@aws-sdk/client-ssm';

import middy from '@middy/core';
const tracer = new Tracer({});
const logger = new Logger({});

let client: SSMClient;

async function lambdaHandler(event: unknown) {
  client = client || tracer.captureAWSv3Client(new SSMClient({}));

  const apiGatewayUrls = await getParameters(
    client,
    process.env.PARAMETER_NAMESPACE!
  );

  const [serviceOneResults, serviceTwoResults] = await Promise.all([
    testApi(
      process.env.PARAMETER_SERVICE_ONE_NAME!,
      apiGatewayUrls.find(
        (p) =>
          p.name ===
          `/${process.env.PARAMETER_NAMESPACE!}/${process.env
            .PARAMETER_SERVICE_ONE_NAME!}`
      )?.value!
    ),
    testApi(
      process.env.PARAMETER_SERVICE_TWO_NAME!,
      apiGatewayUrls.find(
        (p) =>
          p.name ===
          `/${process.env.PARAMETER_NAMESPACE!}/${process.env
            .PARAMETER_SERVICE_TWO_NAME!}`
      )?.value!
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

async function getParameters(client: SSMClient, appName: string) {
  const resp = await client.send(
    new GetParametersByPathCommand({
      Path: `/${appName}/`,
    })
  );
  return resp.Parameters?.map((p) => ({ name: p.Name, value: p.Value })) || [];
}

async function testApi(serviceName: string, apiGatewayUrl: string) {
  const apiResp = await fetch(`${apiGatewayUrl}/hello-world`, {
    method: 'GET',
  });

  return {
    apiGatewayUrl,
    statusCode: apiResp.status,
    statusText: apiResp.statusText,
    headers: apiResp.headers,
    body: await apiResp.json(),
  };
}

export const handler = middy(lambdaHandler)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer));
