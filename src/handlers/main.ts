import  dotenv from 'dotenv';
import { getCandidates, getMessage } from '@services/candidateService';
import { report } from '@services/reportService';

dotenv.config({ path: '.env' });

function main (): void {
    const candidates = getCandidates();

    if (!candidates.length) {
        console.log('候補者がいません。');
        return;
    }

    const reportMessage = getMessage(candidates);

    report(reportMessage);
}

main();