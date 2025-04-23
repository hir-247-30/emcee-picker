import  dotenv from 'dotenv';
import { getCandidate, getMessage } from '@services/candidateService';
import { report } from '@services/reportService';

dotenv.config({ path: '.env' });

function main (): void {
    const candidateResult = getCandidate();

    if (candidateResult.isErr()) {
        console.log('候補者がいません。');
        return;
    }

    const candidates = candidateResult.value;
    const reportMessage = getMessage(candidates);

    const reportResult = report(reportMessage);

    if (reportResult.isErr()) {
        console.log('通知に失敗。');
    }
}

main();