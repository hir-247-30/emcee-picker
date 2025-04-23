import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { err, ok } from 'neverthrow';
import type { Result } from 'neverthrow';

export function report (message: string): Result<void, Error> {
    const reportType = process.env['REPORT_TYPE'];

    switch (reportType) {
        case 'DISCORD':
            reportByDiscord(message);
            break;
        default:
            return err(new Error('通知先が正しくありません。'));
    }

    return ok();
}

function reportByDiscord (content: string): void {
    const requestOptions = {
        url    : process.env['REPORT_URL']!,
        method : 'POST',
        data   : { content },
        headers: { 'Content-Type': 'application/json' },
    };

    axiosRequest<void | string>(requestOptions);
}

async function axiosRequest<T> (requestOptions: AxiosRequestConfig): Promise<void | T> {
    return axios(requestOptions)
        .then((res: AxiosResponse<T>) => {
            return res.data;
        })
        .catch((e: AxiosError<{ error: string }>) => {
            console.log(e.message);
        }
    );
}