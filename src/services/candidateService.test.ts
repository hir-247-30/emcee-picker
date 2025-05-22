import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCandidates, getMessage } from '@services/candidateService';

// envをこねくり回してテストする必要があるので、envをメソッドインジェクションできるようにする
// 各モジュールはenvのinterfaceに依存するように修正する。

describe('getCandidates', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        vi.resetModules();
        process.env = { ...OLD_ENV };
    });

    // ここらへんテストじゃなくて、型でチェックできそう
    it('CANDIDATESが設定されていない場合は空配列を返す', () => {
        delete process.env['CANDIDATES'];
        expect(getCandidates()).toEqual([]);
    });

    it('CANDIDATESが空文字の場合は空配列を返す', () => {
        process.env['CANDIDATES'] = '';
        expect(getCandidates()).toEqual([]);
    });

    it('CANDIDATESが1つの場合はその値のみ返す', () => {
        process.env['CANDIDATES'] = 'A';
        expect(getCandidates()).toEqual(['A']);
    });

    it('CANDIDATESが複数の場合はカンマ区切りで配列を返す', () => {
        process.env['CANDIDATES'] = 'A,B,C';
        expect(getCandidates()).toEqual(['A', 'B', 'C']);
    });
});

describe('getMessage', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        vi.resetModules();
        process.env = { ...OLD_ENV };
    });

    it('TITLEが設定されていない場合は"---"がタイトルになる', () => {
        delete process.env['TITLE'];
        const msg = getMessage(['A', 'B']);
        expect(msg.startsWith('---の司会者（候補順）')).toBe(true);
    });

    it('TITLEが設定されている場合はその値がタイトルになる', () => {
        process.env['TITLE'] = '定例会議';
        const msg = getMessage(['A', 'B']);
        expect(msg.startsWith('定例会議の司会者（候補順）')).toBe(true);
    });

    // getMessageに関係ない
    it('候補者が1人の場合も正しく出力される', () => {
        process.env['TITLE'] = 'テスト会議';
        const msg = getMessage(['A']);
        expect(msg).toContain('A');
    });

    // getMessageに関係ない
    it('候補者が複数の場合も正しく出力される', () => {
        process.env['TITLE'] = 'テスト会議';
        const msg = getMessage(['A', 'B', 'C']);
        expect(msg).toContain('A');
        expect(msg).toContain('B');
        expect(msg).toContain('C');
    });
});
