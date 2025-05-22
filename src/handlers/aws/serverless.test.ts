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
        const result = await handler({}, createDummyContext(), () => { /* noop */ }) as {
            statusCode: number;
            headers   : Record<string, string>;
            body      : string;
        };
        expect(mainMock).toHaveBeenCalled();
        expect(result).toEqual({
            statusCode: 200,
            headers   : { 'Content-Type': 'application/json' },
            body      : JSON.stringify(''),
        });
    });
});
