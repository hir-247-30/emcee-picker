export function getCandidates (): string[] {
    const candidates = process.env['CANDIDATES'] ?? '';
    return candidates.split(',').filter(v => v);
}

export function getMessage (candidates: string[]): string {
    const title = process.env['TITLE'] ?? '---';
    const shuffled = shuffle(candidates).join('、');

    return `${title}の司会者（候補順）\n${shuffled}`;
}

function shuffle<T> (array: readonly T[]): T[] {
    const result = array.slice();

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j] as T, result[i] as T];
    }

    return result;
}
