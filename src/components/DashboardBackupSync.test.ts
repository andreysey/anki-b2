import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DashboardBackupSync from './DashboardBackupSync.vue';
import * as backupUtils from '../utils/backup';

describe('DashboardBackupSync.vue', () => {
  const defaultProps = {
    totalWords: 100,
    totalMastered: 40,
    totalPercentage: 40,
    masteredIds: new Set<string>(['w1', 'w2']),
    srsData: {}
  };

  it('renders overall course progress and labels', () => {
    const wrapper = mount(DashboardBackupSync, {
      props: defaultProps
    });

    expect(wrapper.text()).toContain('Overall Course Progress');
    expect(wrapper.text()).toContain('40 / 100 mastered');
  });

  it('calls downloadBackupFile when export button is clicked', async () => {
    const downloadSpy = vi.spyOn(backupUtils, 'downloadBackupFile').mockImplementation(() => {});
    const wrapper = mount(DashboardBackupSync, {
      props: defaultProps
    });

    const exportBtn = wrapper.findAll('button').find((b) => b.text().includes('Export Backup'));
    expect(exportBtn).toBeDefined();
    await exportBtn?.trigger('click');

    expect(downloadSpy).toHaveBeenCalledWith(defaultProps.masteredIds, defaultProps.srsData);
  });

  it('triggers file input click when Restore Progress button is clicked', async () => {
    const wrapper = mount(DashboardBackupSync, {
      props: defaultProps
    });

    const fileInput = wrapper.find('input[type="file"]').element as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    const restoreBtn = wrapper.findAll('button').find((b) => b.text().includes('Restore Progress'));
    await restoreBtn?.trigger('click');

    expect(clickSpy).toHaveBeenCalled();
  });

  it('emits restore-progress on valid file import', async () => {
    const validJson = JSON.stringify({
      version: 1,
      timestamp: 1700000000000,
      masteredIds: ['w1'],
      srsData: { w1: { level: 2, lastReview: 1700000000000 } }
    });

    const wrapper = mount(DashboardBackupSync, {
      props: defaultProps
    });

    const file = new File([validJson], 'backup.json', { type: 'application/json' });
    const fileInput = wrapper.find('input[type="file"]');

    class MockFileReader {
      onload: ((e: any) => void) | null = null;
      readAsText(_f: any) {
        if (this.onload) {
          this.onload({ target: { result: validJson } });
        }
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      writable: true
    });

    await fileInput.trigger('change');

    expect(wrapper.emitted('restore-progress')).toBeTruthy();
    expect(wrapper.emitted('restore-progress')?.[0]?.[0]).toEqual({
      masteredIds: ['w1'],
      srsData: { w1: { level: 2, lastReview: 1700000000000 } }
    });
    expect(wrapper.text()).toContain('Successfully restored');
  });

  it('displays error message on invalid file import', async () => {
    const invalidJson = 'invalid json data';
    const wrapper = mount(DashboardBackupSync, {
      props: defaultProps
    });

    const file = new File([invalidJson], 'bad.json', { type: 'application/json' });
    const fileInput = wrapper.find('input[type="file"]');

    class MockFileReader {
      onload: ((e: any) => void) | null = null;
      readAsText(_f: any) {
        if (this.onload) {
          this.onload({ target: { result: invalidJson } });
        }
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      writable: true
    });

    await fileInput.trigger('change');

    expect(wrapper.emitted('restore-progress')).toBeFalsy();
    expect(wrapper.text()).toContain('JSON parse error');
  });
});
