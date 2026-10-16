import { expect, test } from '@playwright/test';
import { readFile, mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { cpaFixture } from '../fixtures/accounts';
import { convertSources } from '../../src/conversion/converter';
import { mergedDocument } from '../../src/conversion/export';

test.beforeEach(async ({ page }) => {
  const headers = await readFile('front/public/_headers', 'utf8');
  const csp = headers.split('\n').find((line) => line.includes('Content-Security-Policy:'))!.split('Content-Security-Policy: ')[1];
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() === 'document') {
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } });
    } else await route.continue();
  });
});

test('desktop local-only conversion, privacy, selection, merged download and reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1080 });
  const errors: string[] = [];
  const remoteRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1:4178')) remoteRequests.push(request.url()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('账号转换，留在本地。');
  await expect(page.getByRole('button', { name: '开始转换' })).toBeDisabled();
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/desktop-empty.png', fullPage: true });
  const original = [cpaFixture('codex'), cpaFixture('claude'), cpaFixture('gemini'), { type: 'unsupported', access_token: 'synthetic-secret' }];
  await page.getByLabel('源 JSON 内容').fill(JSON.stringify(original));
  await page.getByRole('button', { name: '开始转换' }).click();
  await expect(page.getByText('3 个可用账号')).toBeVisible();
  await expect(page.getByText('1 项未转换 · 查看原因')).toBeVisible();
  await page.getByRole('button', { name: '预览 JSON' }).first().click();
  const preview = page.getByRole('region', { name: 'JSON 预览' });
  await expect(preview).toContainText('••••••••');
  await expect(preview).not.toContainText('synthetic-codex-refresh');
  await page.screenshot({ path: 'test-results/desktop-results.png', fullPage: true });
  await page.getByLabel('显示凭据').check();
  await expect(preview).toContainText('synthetic-codex-refresh');
  await page.getByLabel('显示凭据').uncheck();
  await page.getByLabel('选择 claude@example.invalid', { exact: true }).uncheck();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载合并 JSON' }).click();
  const downloaded = await downloadEvent;
  expect(downloaded.suggestedFilename()).toMatch(/^sub2api-.*\.json$/);
  const document = JSON.parse(await readFile((await downloaded.path())!, 'utf8'));
  expect(document.accounts).toHaveLength(2);
  expect(document.type).toBe('sub2api-data');
  expect(document.accounts[0].credentials.refresh_token).toBe('synthetic-codex-refresh');
  const stored = await page.evaluate(() => ({ ...localStorage }));
  expect(Object.keys(stored)).toEqual(['cpa2sub2api:preferences:v1']);
  expect(JSON.stringify(stored)).not.toContain('synthetic');
  await page.reload();
  await expect(page.getByLabel('源 JSON 内容')).toHaveValue('');
  await expect(page.getByText('等待转换')).toBeVisible();
  expect(errors).toEqual([]);
  expect(remoteRequests).toEqual([]);
});

test('file upload, per-file download, reverse conversion and ZIP export', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('选择 JSON 文件', { exact: true }).setInputFiles([
    { name: 'claude.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(cpaFixture('claude'))) },
    { name: 'malformed.json', mimeType: 'application/json', buffer: Buffer.from('{ invalid') },
  ]);
  await expect(page.getByText('已载入 2 个文件')).toBeVisible();
  await page.getByRole('button', { name: '开始转换' }).click();
  await expect(page.getByText('1 个可用账号')).toBeVisible();
  const singleEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载 claude.sub2api.json', exact: true }).click();
  expect((await singleEvent).suggestedFilename()).toBe('claude.sub2api.json');
  await page.getByRole('button', { name: '清空', exact: true }).click();
  await page.getByRole('button', { name: 'sub2api CPA', exact: true }).click();
  const forward = convertSources([{ name: 'synthetic.json', text: JSON.stringify([cpaFixture('codex'), cpaFixture('gemini')]) }], 'cpa-to-sub2api');
  await page.getByLabel('源 JSON 内容').fill(JSON.stringify(mergedDocument(forward.entries)));
  await page.getByRole('button', { name: '开始转换' }).click();
  await expect(page.getByRole('button', { name: '下载合并 JSON' })).toHaveCount(0);
  const zipEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: /下载 ZIP/ }).click();
  const zipped = await zipEvent;
  const archive = unzipSync(new Uint8Array(await readFile((await zipped.path())!)));
  expect(Object.keys(archive)).toHaveLength(2);
  expect(JSON.parse(strFromU8(Object.values(archive)[0])).type).toBe('codex');
});

test('mobile layout, empty/error states, mode invalidation and accessible guide', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-empty.png', fullPage: true });
  await page.getByLabel('源 JSON 内容').fill('{"secret":"synthetic-sensitive", invalid}');
  await page.getByRole('button', { name: '开始转换' }).click();
  await expect(page.getByText('JSON 格式无效，请检查括号、引号和逗号。')).toBeVisible();
  await page.getByRole('button', { name: '清空', exact: true }).click();
  await page.getByLabel('源 JSON 内容').fill(JSON.stringify(cpaFixture('antigravity')));
  await page.getByRole('button', { name: '开始转换' }).click();
  await expect(page.getByText('1 个可用账号')).toBeVisible();
  await page.screenshot({ path: 'test-results/mobile-results.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'sub2api CPA', exact: true }).click();
  await expect(page.getByText('等待转换')).toBeVisible();
  await page.getByRole('button', { name: '使用说明', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '使用说明', exact: true })).toBeFocused();
});

test('unavailable localStorage does not block conversion', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.goto('/');
  await page.getByLabel('源 JSON 内容').fill(JSON.stringify(cpaFixture('claude')));
  await page.getByRole('button', { name: '开始转换' }).click();
  await expect(page.getByText('1 个可用账号')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('偏好未保存');
});

test('directory import, ignored non-JSON files and removal preserve the actual batch', async ({ page }) => {
  await mkdir('test-results', { recursive: true });
  const directory = await mkdtemp(resolve('test-results/directory-'));
  try {
    await mkdir(resolve(directory, 'nested'));
    await writeFile(resolve(directory, 'claude.json'), JSON.stringify(cpaFixture('claude')));
    await writeFile(resolve(directory, 'nested/gemini.json'), JSON.stringify(cpaFixture('gemini')));
    await writeFile(resolve(directory, 'ignored.txt'), 'synthetic non-JSON');
    await page.goto('/');
    await page.getByLabel('选择 JSON 目录', { exact: true }).setInputFiles(directory);
    await expect(page.getByText('已载入 2 个文件')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('已忽略 1 个非 JSON 文件');
    await page.getByRole('button', { name: '开始转换' }).click();
    await expect(page.getByText('2 个可用账号')).toBeVisible();
    await page.getByLabel('移除文件 1', { exact: true }).click();
    await expect(page.getByText('等待转换')).toBeVisible();
    await expect(page.getByText('已载入 1 个文件')).toBeVisible();
    await page.getByRole('button', { name: '开始转换' }).click();
    await expect(page.getByText('1 个可用账号')).toBeVisible();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('drag/drop JSON input and provider-filtered selection control exports', async ({ page }) => {
  await page.goto('/');
  const transfer = await page.evaluateHandle((records) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([JSON.stringify(records)], 'dropped.json', { type: 'application/json' }));
    return transfer;
  }, [cpaFixture('claude'), cpaFixture('gemini')]);
  await page.locator('.drop-zone').dispatchEvent('drop', { dataTransfer: transfer });
  await transfer.dispose();
  await expect(page.getByText('已载入 1 个文件')).toBeVisible();
  await page.getByRole('button', { name: '开始转换' }).click();
  await expect(page.getByText('2 个可用账号')).toBeVisible();
  await page.getByLabel('筛选平台').selectOption('claude');
  await expect(page.getByLabel('选择 gemini@example.invalid', { exact: true })).toHaveCount(0);
  await page.getByLabel('全选可见账号').uncheck();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载合并 JSON' }).click();
  const downloaded = await downloadEvent;
  const document = JSON.parse(await readFile((await downloaded.path())!, 'utf8'));
  expect(document.accounts).toHaveLength(1);
  expect(document.accounts[0].platform).toBe('gemini');
  await page.getByLabel('筛选平台').selectOption('all');
  await page.getByLabel('全选可见账号').check();
  await page.getByLabel('全选可见账号').uncheck();
  await expect(page.getByRole('button', { name: '下载合并 JSON' })).toBeDisabled();
});
