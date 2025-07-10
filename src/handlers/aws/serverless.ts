import { main } from '@handlers/main';
import { acquireExecutionLock } from '@services/executionLockService';
import { Handler, ProxyResult } from 'aws-lambda';

export const handler: Handler = async (): Promise<ProxyResult> => {
    // 実行ロックを取得
    const lockResult = await acquireExecutionLock();

    if (lockResult.isErr()) {
        // 失敗時はログだけ残して処理継続
        console.error('実行ロック取得に失敗:', lockResult.error.message);
    } else if (!lockResult.value) {
        // ロック取得失敗（他の実行が先に取得済み）
        return {
            statusCode: 200,
            headers   : {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: '重複実行なのでスキップ' }),
        };
    }

    await main();

    return {
        statusCode: 200,
        headers   : {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: '完了' }),
    };
};
