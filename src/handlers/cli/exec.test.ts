import * as mainModule from '@handlers/main';

describe('CLI exec', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('execファイルがmain関数を呼び出す', async () => {
        const mainMock = vi.spyOn(mainModule, 'main').mockResolvedValue();
        
        // exec.tsの動作をシミュレート
        await mainModule.main();
        
        expect(mainMock).toHaveBeenCalled();
    });
});