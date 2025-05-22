import * as candidateService from '@services/candidateService';
import * as reportService from '@services/reportService';
import { main } from './main';

describe('main', () => {
    let logSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
        vi.restoreAllMocks();
        logSpy = vi.spyOn(console, 'log');
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('候補者がいない場合は何もせずメッセージを出力する', async () => {
        vi.spyOn(candidateService, 'getCandidates').mockReturnValue([]);
        await main();
        expect(logSpy).toHaveBeenCalledWith('候補者がいません。');
    });

    it('候補者がいる場合はgetMessageとreportが呼ばれる', async () => {
        vi.spyOn(candidateService, 'getCandidates').mockReturnValue(['A', 'B']);
        const getMessageMock = vi.spyOn(candidateService, 'getMessage').mockReturnValue('msg');
        const reportMock = vi.spyOn(reportService, 'report');
        await main();
        expect(getMessageMock).toHaveBeenCalledWith(['A', 'B']);
        expect(reportMock).toHaveBeenCalledWith('msg');
    });
});
