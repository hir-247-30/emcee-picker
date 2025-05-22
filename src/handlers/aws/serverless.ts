import { main } from '@handlers/main';
import { Handler, ProxyResult } from 'aws-lambda';

export const handler: Handler = async (): Promise<ProxyResult> => {
    await main();

    return {
        statusCode: 200,
        headers   : {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(''),
    };
};
