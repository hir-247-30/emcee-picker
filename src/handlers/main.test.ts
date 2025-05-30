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
        const reportMock = vi.spyOn(reportService, 'execReport');
        await main();
        expect(getMessageMock).toHaveBeenCalledWith(['A', 'B']);
        expect(reportMock).toHaveBeenCalledWith('msg');
    });

    it('休日の場合はスキップしてメッセージを出力する', async () => {
        vi.spyOn(candidateService, 'getCandidates').mockReturnValue(['A', 'B']);
        const skipReportMock = vi.spyOn(reportService, 'skipReport').mockResolvedValue(true);
        const getMessageMock = vi.spyOn(candidateService, 'getMessage');
        const reportMock = vi.spyOn(reportService, 'execReport');

        await main();

        expect(skipReportMock).toHaveBeenCalled();
        expect(getMessageMock).not.toHaveBeenCalled();
        expect(reportMock).not.toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith('休日なのでスキップします。');
    });
});
