import { WebClient } from '@slack/web-api';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { err, ok } from 'neverthrow';

import type { Result } from 'neverthrow';

export async function execReport (message: string): Promise<void> {
    let result: Result<void, Error>;
    const reportType = process.env['REPORT_TYPE'];
    const timestamp = new Date().toISOString();
    const requestId = process.env['AWS_LAMBDA_REQUEST_ID'] ?? 'unknown';

    console.log(`[${timestamp}] [RequestId: ${requestId}] 通知送信開始: ${reportType ?? 'undefined'} - メッセージ: ${message.slice(0, 50)}...`);

    switch (reportType) {
        case 'DISCORD':
            result = await reportByDiscord(message);
            break;
        case 'SLACK':
            result = await reportBySlack(message);
            break;
        default:
            console.log('通知先が正しくありません。');
            return;
    }

    if (result.isErr()) {
        console.log(`[${timestamp}] 通知送信失敗: ${result.error.message}`);
    } else {
        console.log(`[${timestamp}] 通知送信成功: ${reportType}`);
    }
}

export async function skipReport (today: Date): Promise<boolean> {
    // 未定義
    if (process.env['SKIP_HOLIDAYS'] === undefined) return false;

    // スキップをしない設定
    if (!JSON.parse(process.env['SKIP_HOLIDAYS'])) return false;

    const requestOptions = {
        url   : 'https://holidays-jp.github.io/api/v1/date.json',
        method: 'GET',
    } as const;
    const response = await axiosRequest<Record<string, string>>(requestOptions);

    // フェイルソフト
    if (response.isErr()) return false;

    const holidayList = response.value;

    // JST YYYY-MM-DD
    const formattedToday = today.toLocaleDateString('ja-JP', {
        year    : 'numeric',
        month   : '2-digit',
        day     : '2-digit',
        timeZone: 'Asia/Tokyo'
    }).replace(/\//g, '-');

    return (holidayList[formattedToday] !== undefined);
}

async function reportByDiscord (content: string): Promise<Result<void, Error>> {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Discord API呼び出し開始`);
    
    const requestOptions = {
        url    : process.env['DISCORD_REPORT_URL'] ?? '',
        method : 'POST',
        data   : { content },
        headers: { 'Content-Type': 'application/json' },
    } as const;

    const response = await axiosRequest<string | undefined>(requestOptions);

    if (response.isErr()) {
        console.log(`[${timestamp}] Discord API呼び出し失敗: ${response.error.message}`);
        return err(new Error(`Discord通知に失敗: ${response.error.message}`));
    }

    console.log(`[${timestamp}] Discord API呼び出し成功`);
    return ok();
}

async function reportBySlack (text: string): Promise<Result<void, Error>> {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Slack API呼び出し開始`);
    
    const channel = `#${process.env['SLACK_CHANNEL'] ?? ''}`;
    const client = new WebClient(process.env['SLACK_BOT_OAUTH_TOKEN']);

    try {
        await client.chat.postMessage({ channel, text });
        console.log(`[${timestamp}] Slack API呼び出し成功`);
    }
    catch (e: unknown) {
        const message = e instanceof Error
            ? e.message
            : '予期しないエラーが発生しました';

        console.log(`[${timestamp}] Slack API呼び出し失敗: ${message}`);
        return err(new Error(`Slack通知に失敗: ${message}`));
    }

    return ok();
}

async function axiosRequest<T> (
    requestOptions: AxiosRequestConfig,
): Promise<Result<T, Error>> {
    return axios(requestOptions)
        .then((res: AxiosResponse<T>) => {
            return ok(res.data);
        })
        .catch((e: unknown) => {
            const error = e instanceof Error
                ? e
                : new Error('予期しないエラーが発生しました');

            return err(error);
        });
}
