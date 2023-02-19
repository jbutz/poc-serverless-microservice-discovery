import { injectLambdaContext, Logger } from '@aws-lambda-powertools/logger';
import { captureLambdaHandler, Tracer } from '@aws-lambda-powertools/tracer';

import middy from '@middy/core';
const tracer = new Tracer({});
const logger = new Logger({});

async function lambdaHandler(event: unknown) {
  const [serviceOneApiGatewayUrl, serviceTwoApiGatewayUrl] = await Promise.all([
    getParameter(
      process.env.PARAMETER_NAMESPACE!,
      process.env.PARAMETER_SERVICE_ONE_NAME!
    ),
    getParameter(
      process.env.PARAMETER_NAMESPACE!,
      process.env.PARAMETER_SERVICE_TWO_NAME!
    ),
  ]);

  logger.info('SSM Responses', {
    serviceOneApiGatewayUrl,
    serviceTwoApiGatewayUrl,
  });

  const [serviceOneResults, serviceTwoResults] = await Promise.all([
    testApi(serviceOneApiGatewayUrl),
    testApi(serviceTwoApiGatewayUrl),
  ]);

  return {
    statusCode: 200,
    body: JSON.stringify({
      serviceOneResults,
      serviceTwoResults,
    }),
  };
}

async function getParameter(appName: string, serviceName: string) {
  const reqUrl = new URL('http://localhost:2773/systemsmanager/parameters/get');
  reqUrl.searchParams.append('name', `/${appName}/${serviceName}`);
  const apiResp = await fetch(reqUrl, {
    method: 'GET',
    headers: {
      'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN!,
    },
  });
  const ssmResp = await apiResp.json();
  logger.info('SSM Response', { ssmResp });
  return ssmResp.Parameter.Value;
}

async function testApi(apiGatewayUrl: string) {
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
