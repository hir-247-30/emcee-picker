import { main } from '@handlers/main';
import { checkDuplicateExecution, logExecutionStart } from '@services/executionLockService';
import { Handler, ProxyResult } from 'aws-lambda';

export const handler: Handler = async (): Promise<ProxyResult> => {
    // 重複実行チェック
    const duplicateCheck = await checkDuplicateExecution();
    
    if (duplicateCheck.isErr()) {
        // フェイルソフトで失敗時はログだけ残して処理継続
        console.error('重複実行チェックに失敗:', duplicateCheck.error.message);
    } else if (duplicateCheck.value) {
        // 非同期重複呼び出しでの実行時
        console.log('既に実行済みのためスキップ');
        return {
            statusCode: 200,
            headers   : {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Execution skipped - already executed this minute' }),
        };
    }

    // 実行開始ログを出力
    logExecutionStart();

    await main();

    return {
        statusCode: 200,
        headers   : {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Execution completed successfully' }),
    };
};
