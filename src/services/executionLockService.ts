import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { err, ok } from 'neverthrow';

import type { Result } from 'neverthrow';

const BUCKET_NAME = process.env['LOCK_BUCKET_NAME'] ?? 'emcee-picker-locks';
const s3Client = new S3Client({ region: 'ap-northeast-1' });

export async function acquireExecutionLock (): Promise<Result<boolean, Error>> {
    try {
        const currentTime = new Date();
        const currentMinute = currentTime.toISOString().slice(0, 16); // "2024-12-22T09:00"
        const lockKey = `locks/emcee-picker-${currentMinute}`;

        await s3Client.send(new PutObjectCommand({
            Bucket     : BUCKET_NAME,
            Key        : lockKey,
            Body       : 'LOCK',
            IfNoneMatch: '*', // オブジェクトが存在しない場合のみ作成
        }));

        return ok(true);
        
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'PreconditionFailed') {
            // 他の実行が既にロックを取得済み
            return ok(false);
        }
        
        // その他のエラー（S3接続エラーなど）
        const message = error instanceof Error ? error.message : '';
        return err(new Error(`Failed to acquire execution lock: ${message}`));
    }
}

