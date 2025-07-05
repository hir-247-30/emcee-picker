import { main } from '@handlers/main';
import { acquireExecutionLock } from '@services/executionLockService';
import { Handler, ProxyResult } from 'aws-lambda';

export const handler: Handler = async (): Promise<ProxyResult> => {
    // Lambda環境でのRequestIdチェック
    const requestId = process.env['AWS_LAMBDA_REQUEST_ID'];
    if (!requestId) {
        console.log('Lambda環境でのモジュール読み込み時実行をスキップします。');
        return {
            statusCode: 200,
            headers   : {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Execution skipped - module initialization' }),
        };
    }

    // 実行ロックを取得
    const lockResult = await acquireExecutionLock();
    
    if (lockResult.isErr()) {
        // フェイルソフトで失敗時はログだけ残して処理継続
        console.error('実行ロック取得に失敗:', lockResult.error.message);
    } else if (!lockResult.value) {
        // ロック取得失敗（他の実行が先に取得済み）
        return {
            statusCode: 200,
            headers   : {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Execution skipped - lock already acquired by another instance' }),
        };
    }

    await main();

    return {
        statusCode: 200,
        headers   : {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Execution completed successfully' }),
    };
};
