import { Stack, StackProps } from 'aws-cdk-lib';
import { HttpNamespace, INamespace } from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

export type SharedInfrastructureStackProps = StackProps & {
  namespace: string;
};

export class SharedInfrastructureStack extends Stack {
  public readonly namespace: INamespace;
  constructor(
    scope: Construct,
    id: string,
    props: SharedInfrastructureStackProps
  ) {
    super(scope, id, props);

    // Cloud Map Specific Implementation
    this.namespace = new HttpNamespace(this, 'namespace', {
      name: props.namespace,
    });
  }
}
