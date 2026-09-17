import { describe, it, expect, vi } from 'vitest';
import { updateAppBadge } from './badge';

describe('badge utils', () => {
  it('calls setAppBadge when count > 0 and navigator.setAppBadge exists', async () => {
    const setAppBadgeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'setAppBadge', {
      value: setAppBadgeMock,
      writable: true,
      configurable: true
    });

    updateAppBadge(5);
    expect(setAppBadgeMock).toHaveBeenCalledWith(5);
  });

  it('calls clearAppBadge when count <= 0 and navigator.clearAppBadge exists', async () => {
    const clearAppBadgeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clearAppBadge', {
      value: clearAppBadgeMock,
      writable: true,
      configurable: true
    });

    updateAppBadge(0);
    expect(clearAppBadgeMock).toHaveBeenCalled();
  });

  it('safely catches errors or missing API without throwing', () => {
    // @ts-expect-error mock undefined
    delete navigator.setAppBadge;
    // @ts-expect-error mock undefined
    delete navigator.clearAppBadge;

    expect(() => {
      updateAppBadge(10);
      updateAppBadge(0);
    }).not.toThrow();
  });
});
