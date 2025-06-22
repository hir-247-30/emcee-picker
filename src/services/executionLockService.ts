import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { err, ok } from 'neverthrow';

import type { Result } from 'neverthrow';

const EXECUTION_START_MESSAGE = 'EMCEE_PICKER_EXECUTION_START';
const LOG_GROUP_NAME = '/aws/lambda/emcee-picker';

export async function checkDuplicateExecution (): Promise<Result<boolean, Error>> {
    try {
        const client = new CloudWatchLogsClient({ region: 'ap-northeast-1' });
        
        // 現在時刻の分まで取得 (YYYY-MM-DD HH:MM)
        const now = new Date();
        const currentMinute = now.toISOString().slice(0, 16); // "2024-12-22T09:00"
        
        // 同じ分の開始時刻と終了時刻を計算
        const startTime = new Date(currentMinute + ':00.000Z').getTime();
        const endTime = new Date(currentMinute + ':59.999Z').getTime();

        const command = new FilterLogEventsCommand({
            logGroupName : LOG_GROUP_NAME,
            startTime,
            endTime,
            filterPattern: EXECUTION_START_MESSAGE,
        });

        const response = await client.send(command);
        
        // 既に実行ログが存在する場合はtrue（重複実行）
        const isDuplicate = (response.events?.length ?? 0) > 0;
        
        return ok(isDuplicate);
    } catch (e: unknown) {
        const eMessage = e instanceof Error ? e.message : 'CloudWatch Logsのチェックに失敗しました';
        return err(new Error(eMessage));
    }
}

export function logExecutionStart (): void {
    console.log(EXECUTION_START_MESSAGE);
}
