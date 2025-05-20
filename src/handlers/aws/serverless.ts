import { Handler, ProxyResult } from 'aws-lambda';
import { main } from '@handlers/main'

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