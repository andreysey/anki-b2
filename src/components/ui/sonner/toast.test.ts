import { describe, it, expect, vi } from 'vitest';
import { toast } from './toast';

vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn((msg: string) => `success:${msg}`),
    error: vi.fn((msg: string) => `error:${msg}`),
    warning: vi.fn((msg: string) => `warning:${msg}`),
    info: vi.fn((msg: string) => `info:${msg}`)
  }
}));

describe('toast wrapper', () => {
  it('triggers custom event and calls vue-sonner methods', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    await toast.success('Success message');
    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe('load-toaster');

    await toast.error('Error message');
    await toast.warning('Warning message');
    await toast.info('Info message');

    const { toast: sonnerToast } = await import('vue-sonner');
    expect(sonnerToast.success).toHaveBeenCalledWith('Success message');
    expect(sonnerToast.error).toHaveBeenCalledWith('Error message');
    expect(sonnerToast.warning).toHaveBeenCalledWith('Warning message');
    expect(sonnerToast.info).toHaveBeenCalledWith('Info message');
  });
});
