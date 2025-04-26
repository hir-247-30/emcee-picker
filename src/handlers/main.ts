import  dotenv from 'dotenv';
import { getCandidate, getMessage } from '@services/candidateService';
import { report } from '@services/reportService';

dotenv.config({ path: '.env' });

function main (): void {
    const candidates = getCandidate();

    if (!candidates.length) {
        console.log('候補者がいません。');
        return;
    }

    const reportMessage = getMessage(candidates);

    report(reportMessage);
}

main();