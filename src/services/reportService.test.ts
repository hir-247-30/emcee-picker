import { execReport } from '@services/reportService';
import axios from 'axios';

const postMessageMock = vi.fn();

vi.mock('axios');
vi.mock('@slack/web-api', () => {
    return {
        WebClient: vi.fn().mockImplementation(() => ({
            chat: { postMessage: postMessageMock },
        })),
        ErrorCode: { PlatformError: 'platform_error' },
    };
});

// env問題
describe('execReport', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...OLD_ENV };
    });
    afterEach(() => {
        process.env = OLD_ENV;
    });

    it('REPORT_TYPEがDISCORDのときDiscordに通知する', async () => {
        process.env['REPORT_TYPE'] = 'DISCORD';
        process.env['DISCORD_REPORT_URL'] = 'http://discord.test/webhook';

        // なんじゃこの型は
        (
            axios as unknown as { mockResolvedValue: (v: unknown) => void }
        ).mockResolvedValue({ data: {} });

        // なんでspyいれてる？
        const spy = vi.spyOn(console, 'log');
        await execReport('test message');
        expect(axios).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('REPORT_TYPEがSLACKのときSlackに通知する', async () => {
        process.env['REPORT_TYPE'] = 'SLACK';
        process.env['SLACK_BOT_OAUTH_TOKEN'] = 'xoxb-test';
        process.env['SLACK_CHANNEL'] = 'general';
        postMessageMock.mockResolvedValue({});
        await execReport('test message');
        expect(postMessageMock).toHaveBeenCalled();
    });

    it('REPORT_TYPEが不正な場合はエラーを出力する', async () => {
        process.env['REPORT_TYPE'] = 'UNKNOWN';
        const spy = vi.spyOn(console, 'log');
        await execReport('test message');
        expect(spy).toHaveBeenCalledWith('通知先が正しくありません。');
        spy.mockRestore();
    });
});
