import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWakeLock } from './useWakeLock';

describe('useWakeLock composable', () => {
  let mockSentinel: { release: ReturnType<typeof vi.fn>; addEventListener: ReturnType<typeof vi.fn> };
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSentinel = {
      release: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn()
    };
    mockRequest = vi.fn().mockResolvedValue(mockSentinel);

    Object.defineProperty(navigator, 'wakeLock', {
      value: {
        request: mockRequest
      },
      configurable: true
    });
  });

  it('reports isSupported true when navigator.wakeLock is available', () => {
    const { isSupported } = useWakeLock();
    expect(isSupported).toBe(true);
  });

  it('requests screen wake lock and marks isLocked as true', async () => {
    const { isLocked, requestWakeLock } = useWakeLock();
    expect(isLocked.value).toBe(false);

    await requestWakeLock();

    expect(mockRequest).toHaveBeenCalledWith('screen');
    expect(isLocked.value).toBe(true);
  });

  it('releases screen wake lock cleanly', async () => {
    const { isLocked, requestWakeLock, releaseWakeLock } = useWakeLock();

    await requestWakeLock();
    expect(isLocked.value).toBe(true);

    await releaseWakeLock();
    expect(mockSentinel.release).toHaveBeenCalled();
    expect(isLocked.value).toBe(false);
  });
});
