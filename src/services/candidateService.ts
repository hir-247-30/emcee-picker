export function getCandidate (): string[] {
    const undefinedCandidates = process.env['CANDIDATES'] ?? '';
    return undefinedCandidates.split(',').filter(v => v);
}

export function getMessage (candidate: string[]): string {
    const title = process.env['TITLE'] ?? '---';
    const shuffled = shuffle(candidate).join('、');

    return `${title}の司会者（候補順）\n${shuffled}`;
}

function shuffle<T> (array: T[]): T[] {
    const result = array.slice();

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [result[j]!, result[i]!];
    }

    return result;
}