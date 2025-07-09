import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { SchedulerSchedule } from '@cdktf/provider-aws/lib/scheduler-schedule';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { config } from 'dotenv';

config();

class EmceePickerStack extends TerraformStack {
    constructor (scope: Construct, id: string) {
        super(scope, id);

        // プロバイダ設定
        new AwsProvider(this, 'AWS', {
            region: 'ap-northeast-1',
        });

        // CloudWatch Log グループの登録
        const logGroup = new CloudwatchLogGroup(this, 'LambdaLogGroup', {
            name           : '/aws/lambda/emcee-picker',
            retentionInDays: Number(process.env['AWS_LOGS_RETENTION_DAYS']) || 7,
        });

        // Lambda 用 IAM Role
        const lambdaAssumeRolePolicy = new DataAwsIamPolicyDocument(this, 'LambdaAssumeRolePolicy', {
            statement: [
                {
                    actions   : ['sts:AssumeRole'],
                    effect    : 'Allow',
                    principals: [
                        {
                            type       : 'Service',
                            identifiers: ['lambda.amazonaws.com'],
                        },
                    ],
                },
            ],
        });

        // Lambda ロール
        const lambdaRole = new IamRole(this, 'LambdaRole', {
            name            : 'emcee-picker-lambda-role',
            assumeRolePolicy: lambdaAssumeRolePolicy.json,
        });

        // Lambda 実行ポリシー
        new IamRolePolicyAttachment(this, 'LambdaBasicExecution', {
            role     : lambdaRole.name,
            policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        });

        // EventBridge Scheduler用のIAMポリシー
        const schedulerAssumeRolePolicy = new DataAwsIamPolicyDocument(this, 'SchedulerAssumeRolePolicy', {
            statement: [
                {
                    actions   : ['sts:AssumeRole'],
                    effect    : 'Allow',
                    principals: [
                        {
                            type       : 'Service',
                            identifiers: ['scheduler.amazonaws.com'],
                        },
                    ],
                },
            ],
        });

        // EventBridge ロール
        const schedulerRole = new IamRole(this, 'SchedulerRole', {
            name            : 'emcee-picker-scheduler-role',
            assumeRolePolicy: schedulerAssumeRolePolicy.json,
        });

        // Lambda 本体を先に定義
        const lambdaFunction = new LambdaFunction(this, 'EmceePickerLambda', {
            functionName  : 'emcee-picker',
            role          : lambdaRole.arn,
            handler       : 'index.handler',
            runtime       : 'nodejs22.x',
            timeout       : Number(process.env['AWS_FUNCTION_TIMEOUT']) || 30,
            memorySize    : Number(process.env['AWS_FUNCTION_MEMORY_SIZE']) || 256,
            filename      : '../../../dist/upload.zip',
            sourceCodeHash: '${filebase64sha256("../../../dist/upload.zip")}',
            environment   : {
                variables: {
                    NODE_ENV             : 'production',
                    TITLE                : process.env['TITLE'] ?? '',
                    CANDIDATES           : process.env['CANDIDATES'] ?? '',
                    REPORT_TYPE          : process.env['REPORT_TYPE'] ?? '',
                    DISCORD_REPORT_URL   : process.env['DISCORD_REPORT_URL'] ?? '',
                    SLACK_BOT_OAUTH_TOKEN: process.env['SLACK_BOT_OAUTH_TOKEN'] ?? '',
                    SLACK_CHANNEL        : process.env['SLACK_CHANNEL'] ?? '',
                    SKIP_HOLIDAYS        : process.env['SKIP_HOLIDAYS'] ?? 'true',
                },
            },
            dependsOn: [logGroup],
        });

        // Scheduler用Lambda呼び出しポリシー
        new IamRolePolicy(this, 'SchedulerLambdaInvokePolicy', {
            name  : 'emcee-picker-scheduler-invoke-lambda-policy',
            role  : schedulerRole.name,
            policy: JSON.stringify({
                Version  : '2012-10-17',
                Statement: [
                    {
                        Effect  : 'Allow',
                        Action  : 'lambda:InvokeFunction',
                        Resource: lambdaFunction.arn,
                    },
                ],
            }),
        });


        // EventBridge 実行スケジューラ
        const schedulerSchedule = new SchedulerSchedule(this, 'DailyExecutionSchedule', {
            name                      : 'emcee-picker-execution',
            description               : 'Lambdaの実行スケジューラ',
            scheduleExpression        : process.env['AWS_FUNCTION_EXECUTION_SCHEDULE'] ?? 'cron(0 0 * * ? *)',
            scheduleExpressionTimezone: 'Asia/Tokyo',
            state                     : 'ENABLED',
            flexibleTimeWindow        : {
                mode: 'OFF',
            },
            target: {
                arn    : lambdaFunction.arn,
                roleArn: schedulerRole.arn,
            },
        });

        new TerraformOutput(this, 'lambda_function_name', {
            value: lambdaFunction.functionName,
        });

        new TerraformOutput(this, 'lambda_function_arn', {
            value: lambdaFunction.arn,
        });

        new TerraformOutput(this, 'eventbridge_schedule_name', {
            value: schedulerSchedule.name,
        });

        new TerraformOutput(this, 'cloudwatch_log_group_name', {
            value: logGroup.name,
        });
    }
}

const app = new App();
new EmceePickerStack(app, 'emcee-picker');
app.synth();
