import { getCandidates, getMessage } from '@services/candidateService';
import { skipReport, execReport } from '@services/reportService';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export async function main (): Promise<void> {
    const candidates = getCandidates();

    if (!candidates.length) {
        console.log('候補者がいません。');
        return;
    }

    if (await skipReport(new Date)) {
        console.log('休日なのでスキップします。');
        return;
    }

    const reportMessage = getMessage(candidates);

    await execReport(reportMessage);
}

await main();
