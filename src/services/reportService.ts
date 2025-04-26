import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { WebClient  } from '@slack/web-api';
import { err, ok } from 'neverthrow';
import type { Result } from 'neverthrow';

export async function report (message: string): Promise<void> {
    let result: Result<void, Error>;
    const reportType = process.env['REPORT_TYPE'];

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
        console.log(result.error.message);
    }
}

async function reportByDiscord (content: string): Promise<Result<void, Error>> {
    const requestOptions = {
        url    : process.env['DISCORD_REPORT_URL']!,
        method : 'POST',
        data   : { content },
        headers: { 'Content-Type': 'application/json' },
    };

    const response = await axiosRequest<void | string>(requestOptions);

    if (response.isErr()) {
        return err(new Error(`Discord通知に失敗: ${response.error.message}`));
    }

    return ok();
}

async function reportBySlack (text: string): Promise<Result<void, Error>> {
    const channel = `#${process.env['SLACK_CHANNEL']!}`;
    const client = new WebClient(process.env['SLACK_BOT_OAUTH_TOKEN']!);

    const response = await client.chat.postMessage({ channel, text });

    if (!response.ok) {
        return err(new Error(`Slack通知に失敗: ${response.error}`));
    }

    return ok();
}

async function axiosRequest<T> (requestOptions: AxiosRequestConfig): Promise<Result<T, Error>> {
    return axios(requestOptions)
        .then((res: AxiosResponse<T>) => {
            return ok(res.data);
        })
        .catch((e: AxiosError<{ error: string }>) => {
            return err(new Error(e.message));
        }
    );
}