import { handler } from '@handlers/aws/serverless';
import * as mainModule from '@handlers/main';
import * as executionLockService from '@services/executionLockService';

import type { Context } from 'aws-lambda';

describe('handler', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    function createDummyContext (): Context {
        return {
            callbackWaitsForEmptyEventLoop: false,
            functionName                  : 'test',
            functionVersion               : '1',
            invokedFunctionArn:
        'arn:aws:lambda:region:account-id:function:function-name',
            memoryLimitInMB         : '128',
            awsRequestId            : 'test-id',
            logGroupName            : 'log-group',
            logStreamName           : 'log-stream',
            getRemainingTimeInMillis: () => 1000,
            done                    : () => { /* noop */ },
            fail                    : () => { /* noop */ },
            succeed                 : () => { /* noop */ },
        };
    }

    it('mainが呼ばれ、200レスポンスを返す', async () => {
        // RequestIdを設定してLambda環境をシミュレート
        process.env['AWS_LAMBDA_REQUEST_ID'] = 'test-request-id';
        
        const mainMock = vi.spyOn(mainModule, 'main').mockResolvedValue();
        const { ok } = await import('neverthrow');
        const acquireLockMock = vi.spyOn(executionLockService, 'acquireExecutionLock').mockResolvedValue(ok(true));
        
        const result = await handler({}, createDummyContext(), () => { /* noop */ }) as {
            statusCode: number;
            headers   : Record<string, string>;
            body      : string;
        };
        
        expect(acquireLockMock).toHaveBeenCalled();
        expect(mainMock).toHaveBeenCalled();
        expect(result).toEqual({
            statusCode: 200,
            headers   : { 'Content-Type': 'application/json' },
            body      : JSON.stringify({ message: 'Execution completed successfully' }),
        });
        
        // テスト後にクリーンアップ
        delete process.env['AWS_LAMBDA_REQUEST_ID'];
    });

    it('ロック取得でエラーが発生した場合、フェイルソフトで処理を継続する', async () => {
        // RequestIdを設定してLambda環境をシミュレート
        process.env['AWS_LAMBDA_REQUEST_ID'] = 'test-request-id';
        
        const mainMock = vi.spyOn(mainModule, 'main').mockResolvedValue();
        const { err } = await import('neverthrow');
        const acquireLockMock = vi.spyOn(executionLockService, 'acquireExecutionLock').mockResolvedValue(err(new Error('S3 error')));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        
        const result = await handler({}, createDummyContext(), () => { /* noop */ }) as {
            statusCode: number;
            headers   : Record<string, string>;
            body      : string;
        };
        
        expect(acquireLockMock).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith('実行ロック取得に失敗:', 'S3 error');
        expect(mainMock).toHaveBeenCalled();
        expect(result).toEqual({
            statusCode: 200,
            headers   : { 'Content-Type': 'application/json' },
            body      : JSON.stringify({ message: 'Execution completed successfully' }),
        });
        
        // テスト後にクリーンアップ
        delete process.env['AWS_LAMBDA_REQUEST_ID'];
    });

    it('ロック取得に失敗した場合、実行をスキップする', async () => {
        // RequestIdを設定してLambda環境をシミュレート
        process.env['AWS_LAMBDA_REQUEST_ID'] = 'test-request-id';
        
        const mainMock = vi.spyOn(mainModule, 'main').mockResolvedValue();
        const { ok } = await import('neverthrow');
        const acquireLockMock = vi.spyOn(executionLockService, 'acquireExecutionLock').mockResolvedValue(ok(false));
        
        const result = await handler({}, createDummyContext(), () => { /* noop */ }) as {
            statusCode: number;
            headers   : Record<string, string>;
            body      : string;
        };
        
        expect(acquireLockMock).toHaveBeenCalled();
        expect(mainMock).not.toHaveBeenCalled();
        expect(result).toEqual({
            statusCode: 200,
            headers   : { 'Content-Type': 'application/json' },
            body      : JSON.stringify({ message: 'Execution skipped - lock already acquired by another instance' }),
        });
        
        // テスト後にクリーンアップ
        delete process.env['AWS_LAMBDA_REQUEST_ID'];
    });
});
