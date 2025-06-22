import * as executionLockService from '../../services/executionLockService';
import * as mainModule from '../main';

import { handler } from './serverless';

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
        const mainMock = vi.spyOn(mainModule, 'main').mockResolvedValue();
        const { ok } = await import('neverthrow');
        const checkDuplicateMock = vi.spyOn(executionLockService, 'checkDuplicateExecution').mockResolvedValue(ok(false));
        const logExecutionStartMock = vi.spyOn(executionLockService, 'logExecutionStart').mockImplementation(() => undefined);
        
        const result = await handler({}, createDummyContext(), () => { /* noop */ }) as {
            statusCode: number;
            headers   : Record<string, string>;
            body      : string;
        };
        
        expect(checkDuplicateMock).toHaveBeenCalled();
        expect(logExecutionStartMock).toHaveBeenCalled();
        expect(mainMock).toHaveBeenCalled();
        expect(result).toEqual({
            statusCode: 200,
            headers   : { 'Content-Type': 'application/json' },
            body      : JSON.stringify({ message: 'Execution completed successfully' }),
        });
    });

    it('重複実行チェックでエラーが発生した場合、フェイルソフトで処理を継続する', async () => {
        const mainMock = vi.spyOn(mainModule, 'main').mockResolvedValue();
        const { err } = await import('neverthrow');
        const checkDuplicateMock = vi.spyOn(executionLockService, 'checkDuplicateExecution').mockResolvedValue(err(new Error('CloudWatch error')));
        const logExecutionStartMock = vi.spyOn(executionLockService, 'logExecutionStart').mockImplementation(() => undefined);
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        
        const result = await handler({}, createDummyContext(), () => { /* noop */ }) as {
            statusCode: number;
            headers   : Record<string, string>;
            body      : string;
        };
        
        expect(checkDuplicateMock).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith('重複実行チェックに失敗:', 'CloudWatch error');
        expect(logExecutionStartMock).toHaveBeenCalled();
        expect(mainMock).toHaveBeenCalled();
        expect(result).toEqual({
            statusCode: 200,
            headers   : { 'Content-Type': 'application/json' },
            body      : JSON.stringify({ message: 'Execution completed successfully' }),
        });
    });

    it('重複実行が検出された場合、実行をスキップする', async () => {
        const mainMock = vi.spyOn(mainModule, 'main').mockResolvedValue();
        const { ok } = await import('neverthrow');
        const checkDuplicateMock = vi.spyOn(executionLockService, 'checkDuplicateExecution').mockResolvedValue(ok(true));
        
        const result = await handler({}, createDummyContext(), () => { /* noop */ }) as {
            statusCode: number;
            headers   : Record<string, string>;
            body      : string;
        };
        
        expect(checkDuplicateMock).toHaveBeenCalled();
        expect(mainMock).not.toHaveBeenCalled();
        expect(result).toEqual({
            statusCode: 200,
            headers   : { 'Content-Type': 'application/json' },
            body      : JSON.stringify({ message: 'Execution skipped - already executed this minute' }),
        });
    });
});
