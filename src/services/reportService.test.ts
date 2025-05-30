import { execReport, skipReport } from '@services/reportService';
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

describe('skipReport', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...OLD_ENV };
    });
    afterEach(() => {
        process.env = OLD_ENV;
    });

    it('祝日の場合はtrueを返す', async () => {
        process.env['SKIP_HOLIDAYS'] = 'true';
        const currentYear = new Date().getFullYear().toString();
        const holidayDate = new Date(`${currentYear}-01-01`); // 元旦
        (
            axios as unknown as { mockResolvedValue: (v: unknown) => void }
        ).mockResolvedValue({
            data: {
                [`${currentYear}-01-01`]: '元日'
            }
        });

        const result = await skipReport(holidayDate);
        expect(result).toBe(true);
        expect(axios).toHaveBeenCalledWith({
            url   : 'https://holidays-jp.github.io/api/v1/date.json',
            method: 'GET'
        });
    });

    it('祝日でない場合はfalseを返す', async () => {
        process.env['SKIP_HOLIDAYS'] = 'true';
        const currentYear = new Date().getFullYear().toString();
        const weekdayDate = new Date(`${currentYear}-01-02`); // 平日
        (
            axios as unknown as { mockResolvedValue: (v: unknown) => void }
        ).mockResolvedValue({
            data: {
                [`${currentYear}-01-01`]: '元日'
            }
        });

        const result = await skipReport(weekdayDate);
        expect(result).toBe(false);
    });

    it('SKIP_HOLIDAYSが未定義の場合はfalseを返す', async () => {
        const currentYear = new Date().getFullYear().toString();
        const date = new Date(`${currentYear}-01-01`);
        const result = await skipReport(date);
        expect(result).toBe(false);
    });

    it('SKIP_HOLIDAYSがfalseの場合はfalseを返す', async () => {
        process.env['SKIP_HOLIDAYS'] = 'false';
        const currentYear = new Date().getFullYear().toString();
        const date = new Date(`${currentYear}-01-01`);
        const result = await skipReport(date);
        expect(result).toBe(false);
    });

    it('祝日APIの呼び出しに失敗した場合はfalseを返す', async () => {
        process.env['SKIP_HOLIDAYS'] = 'true';
        const currentYear = new Date().getFullYear().toString();
        const date = new Date(`${currentYear}-01-01`);
        (
            axios as unknown as { mockRejectedValue: (v: unknown) => void }
        ).mockRejectedValue(new Error('API Error'));

        const result = await skipReport(date);
        expect(result).toBe(false);
    });
});
