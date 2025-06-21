import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

class EmceePickerStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // プロバイダ設定
    new AwsProvider(this, 'AWS', {
      region: 'ap-northeast-1',
    });

    // CloudWatch Log グループの登録
    // デフォルトで最大14日保存
    const logGroup = new CloudwatchLogGroup(this, 'LambdaLogGroup', {
      name: '/aws/lambda/emcee-picker',
      retentionInDays: 14,
    });

    // Lambda 用 IAM Role
    const lambdaAssumeRolePolicy = new DataAwsIamPolicyDocument(this, 'LambdaAssumeRolePolicy', {
      statement: [
        {
          actions: ['sts:AssumeRole'],
          effect: 'Allow',
          principals: [
            {
              type: 'Service',
              identifiers: ['lambda.amazonaws.com'],
            },
          ],
        },
      ],
    });

    const lambdaRole = new IamRole(this, 'LambdaRole', {
      name: 'emcee-picker-lambda-role',
      assumeRolePolicy: lambdaAssumeRolePolicy.json,
    });

    // Lambda 実行ポリシー
    new IamRolePolicyAttachment(this, 'LambdaBasicExecution', {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });


    // Lambda 本体
    const lambdaFunction = new LambdaFunction(this, 'EmceePickerLambda', {
      functionName: 'emcee-picker',
      role: lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs22.x',
      timeout: 30,
      memorySize: 256,
      filename: '../../../dist/upload.zip',
      sourceCodeHash: '${filebase64sha256("../../../dist/upload.zip")}',
      environment: {
        variables: {
          NODE_ENV: 'production',
        },
      },
      reservedConcurrentExecutions: 1, // 重複実行の防止
    });

    // EventBridge 実行ルール
    // デフォルトJST毎朝9時
    const eventRule = new CloudwatchEventRule(this, 'DailyExecutionRule', {
      name: 'emcee-picker-daily-execution',
      description: 'Execute emcee-picker Lambda daily at 9 AM JST',
      scheduleExpression: 'cron(0 0 * * ? *)', // 9 AM JST = 0 AM UTC
      state: 'ENABLED',
    });

    // EventBridge ターゲット
    new CloudwatchEventTarget(this, 'LambdaTarget', {
      rule: eventRule.name,
      targetId: 'EmceePickerLambdaTarget',
      arn: lambdaFunction.arn,
    });

    // Lambda ⇔ EventBridge 間の認可
    new LambdaPermission(this, 'AllowEventBridge', {
      statementId: 'AllowExecutionFromEventBridge',
      action: 'lambda:InvokeFunction',
      functionName: lambdaFunction.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: eventRule.arn,
    });

    new TerraformOutput(this, 'lambda_function_name', {
      value: lambdaFunction.functionName,
    });

    new TerraformOutput(this, 'lambda_function_arn', {
      value: lambdaFunction.arn,
    });

    new TerraformOutput(this, 'eventbridge_rule_name', {
      value: eventRule.name,
    });

    new TerraformOutput(this, 'cloudwatch_log_group_name', {
      value: logGroup.name,
    });
  }
}

const app = new App();
new EmceePickerStack(app, 'emcee-picker');
app.synth();