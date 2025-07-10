import { acquireExecutionLock } from '@services/executionLockService';

const mockSend = vi.hoisted(() => vi.fn());
vi.mock('@aws-sdk/client-s3', () => ({
    S3Client: vi.fn().mockImplementation(() => ({
        send: mockSend,
    })),
    PutObjectCommand: vi.fn().mockImplementation((params: unknown) => params),
}));

describe('acquireExecutionLock', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...OLD_ENV };
    });

    afterEach(() => {
        process.env = OLD_ENV;
    });

    it('ロック取得に成功した場合はtrueを返す', async () => {
        mockSend.mockResolvedValue({});

        const result = await acquireExecutionLock();

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(true);
        }
        expect(mockSend).toHaveBeenCalledWith(
            expect.objectContaining({
                Bucket     : 'emcee-picker-locks',
                Key        : expect.stringMatching(/^locks\/emcee-picker-\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/) as string,
                Body       : 'LOCK',
                IfNoneMatch: '*',
            })
        );
    });

    it('他の実行が既にロックを取得済みの場合はfalseを返す', async () => {
        const preconditionError = new Error('Precondition failed');
        preconditionError.name = 'PreconditionFailed';
        mockSend.mockRejectedValue(preconditionError);

        const result = await acquireExecutionLock();

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(false);
        }
    });

    it('S3接続エラーなどの場合はエラーを返す', async () => {
        const s3Error = new Error('S3 connection error');
        mockSend.mockRejectedValue(s3Error);

        const result = await acquireExecutionLock();

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.message).toBe('S3 connection error');
        }
    });

    it('不明なエラーの場合はエラーを返す', async () => {
        mockSend.mockRejectedValue('unknown error');

        const result = await acquireExecutionLock();

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.message).toBe('<不明なエラー>');
        }
    });

    it('LOCK_BUCKET_NAME環境変数が設定されている場合はそれを使用する', async () => {
        process.env['LOCK_BUCKET_NAME'] = 'custom-bucket';
        mockSend.mockResolvedValue({});

        const result = await acquireExecutionLock();

        expect(result.isOk()).toBe(true);
        expect(mockSend).toHaveBeenCalled();
    });

    it('ロックキーが現在の分まで含む形式で生成される', async () => {
        const mockDate = new Date('2024-12-22T09:05:30Z');
        vi.setSystemTime(mockDate);
        mockSend.mockResolvedValue({});

        await acquireExecutionLock();

        expect(mockSend).toHaveBeenCalledWith(
            expect.objectContaining({
                Key: 'locks/emcee-picker-2024-12-22T09:05',
            })
        );

        vi.useRealTimers();
    });
});