import { getCandidates, getMessage } from '@services/candidateService';
import { report } from '@services/reportService';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export async function main (): Promise<void> {
    const candidates = getCandidates();

    if (!candidates.length) {
        console.log('候補者がいません。');
        return;
    }

    const reportMessage = getMessage(candidates);

    await report(reportMessage);
}

await main();
