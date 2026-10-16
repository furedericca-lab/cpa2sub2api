import { useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeftRight, ArrowRight, Braces, Check, ChevronDown, Clipboard, FileJson, FolderOpen, HelpCircle, LoaderCircle, LockKeyhole, RotateCcw, ShieldCheck, Upload, X } from 'lucide-react';
import { convertSources } from '../../src/conversion/converter';
import { exportName, mergedDocument, zipEntries } from '../../src/conversion/export';
import { redact } from '../../src/conversion/json';
import { LIMITS, type ConversionResult, type ConvertedEntry, type Direction, type InputSource, type Provider } from '../../src/conversion/types';
import { loadSettings, saveSettings } from './lib/settings';
import { ConversionGuide } from './components/ConversionGuide';

const providerNames: Record<Provider, string> = { codex: 'Codex', claude: 'Claude', gemini: 'Gemini', antigravity: 'Antigravity' };

function download(data: string | Uint8Array, name: string) {
  const blob = new Blob([typeof data === 'string' ? data : Uint8Array.from(data).buffer], { type: typeof data === 'string' ? 'application/json;charset=utf-8' : 'application/zip' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function App() {
  const [direction, setDirection] = useState<Direction>('cpa-to-sub2api');
  const [sources, setSources] = useState<InputSource[]>([]);
  const [paste, setPaste] = useState('');
  const [settings, setSettings] = useState(loadSettings);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('all');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [guide, setGuide] = useState(false);
  const filesRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const helpRef = useRef<HTMLButtonElement>(null);
  const generation = useRef(0);
  const toSub = direction === 'cpa-to-sub2api';
  const entries = result?.entries ?? [];
  const chosen = entries.filter((entry) => selected.has(entry.id));
  const visible = entries.filter((entry) => filter === 'all' || entry.provider === filter);
  const preview = entries.find((entry) => entry.id === previewId);
  const previewText = useMemo(() => preview ? JSON.stringify(reveal ? preview.document : redact(preview.document), null, 2) : '', [preview, reveal]);
  const warningCount = entries.filter((entry) => entry.warnings.length).length;

  function invalidate() {
    setResult(null);
    setSelected(new Set());
    setPreviewId(null);
    setReveal(false);
    setFilter('all');
    setNotice('');
  }

  function switchMode(next: Direction) {
    if (next === direction) return;
    generation.current++;
    setBusy(false);
    setDirection(next);
    invalidate();
  }

  async function importFiles(files: FileList | File[]) {
    const all = Array.from(files);
    const json = all.filter((file) => file.name.toLowerCase().endsWith('.json'));
    if (!json.length) { setNotice('请选择 JSON 文件。导入目录请点击“选择目录”，ZIP 文件请先解压。'); return; }
    const oldBytes = sources.reduce((n, item) => n + new TextEncoder().encode(item.text).byteLength, 0);
    if (json.length + sources.length > LIMITS.files || json.reduce((n, file) => n + file.size, oldBytes) > LIMITS.bytes) { setNotice('文件超过 500 个或总大小超过 20 MiB，请减少文件后重试。'); return; }
    const current = ++generation.current;
    invalidate();
    setBusy(true);
    try {
      const next: InputSource[] = [];
      for (const file of json) next.push({ name: file.name, text: await file.text() });
      if (current !== generation.current) return;
      setSources((previous) => [...previous, ...next]);
      if (all.length !== json.length) setNotice(`已忽略 ${all.length - json.length} 个非 JSON 文件。`);
    } catch {
      if (current === generation.current) setNotice('文件读取失败，请重新选择。');
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  function clear() {
    generation.current++;
    setSources([]);
    setPaste('');
    setBusy(false);
    invalidate();
  }

  function convert() {
    invalidate();
    try {
      const inputs = [...sources, ...(paste.trim() ? [{ name: 'pasted.json', text: paste }] : [])];
      if (!inputs.length) { setNotice('请先导入文件或粘贴 JSON。'); return; }
      const next = convertSources(inputs, direction, settings);
      setResult(next);
      setSelected(new Set(next.entries.map((entry) => entry.id)));
      if (!saveSettings(settings)) setNotice('设置仅本次生效，下次使用时需重新填写。');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '转换失败，请检查输入。');
    }
  }

  function exportSelected(kind: 'merged' | 'zip') {
    try {
      if (!chosen.length) return;
      if (kind === 'merged') download(JSON.stringify(mergedDocument(chosen), null, 2), exportName(direction, 'json'));
      else download(zipEntries(chosen), exportName(direction, 'zip'));
      setNotice(`已生成 ${chosen.length} 个账号的文件。`);
    } catch {
      setNotice('导出失败，可能是浏览器内存不足。请减少选择后重试。');
    }
  }

  function toggle(entry: ConvertedEntry) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(entry.id)) next.delete(entry.id); else next.add(entry.id);
      return next;
    });
  }

  async function copyPreview() {
    if (!preview) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(reveal ? preview.document : redact(preview.document), null, 2));
      setNotice(reveal ? '已复制凭证，请留意剪贴板记录。' : '已复制脱敏内容。导入账号请下载 JSON 文件。');
    } catch {
      setNotice('浏览器不允许访问剪贴板，请改为下载文件。');
    }
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="/" aria-label="CPA 与 sub2api 账号转换首页"><span className="brand-symbol"><ArrowLeftRight size={21} /></span><span>CPA <span className="brand-separator">/</span> sub2api</span><span className="brand-caption">账号转换</span></a>
      <div className="header-actions"><button ref={helpRef} className="text-button" onClick={() => setGuide(true)}><HelpCircle size={16} /> 使用说明</button></div>
    </header>

    <main>
      <section className="page-intro"><div><div className="eyebrow">OAuth 账号</div><h1>账号文件互转</h1><p>在 CLIProxyAPI 与 sub2api 之间转换账号文件。</p></div><div className="privacy-stamp"><ShieldCheck size={24} /><span>本地处理<small>文件内容仅在浏览器内处理</small></span></div></section>

      <section className="workspace" aria-label="账号转换工作台">
        <div className="workspace-bar"><div className="mode-tabs" role="group" aria-label="转换方向"><button aria-pressed={toSub} className={toSub ? 'mode-tab active' : 'mode-tab'} onClick={() => switchMode('cpa-to-sub2api')}>CPA <ArrowRight size={16} /> sub2api</button><button aria-pressed={!toSub} className={!toSub ? 'mode-tab active' : 'mode-tab'} onClick={() => switchMode('sub2api-to-cpa')}>sub2api <ArrowRight size={16} /> CPA</button></div><span className="format-label">{toSub ? '导入 sub2api' : '导入 CLIProxyAPI'}</span></div>

        <div className="editor-grid">
          <section className="input-pane" aria-labelledby="import-title">
            <div className="section-heading"><h2 id="import-title"><span className="step">01</span> 添加账号文件</h2><button className="text-button subtle" onClick={clear} disabled={!sources.length && !paste && !busy && !result}><RotateCcw size={14} /> 清空</button></div>
            <p className="section-description">{toSub ? '选择 CLIProxyAPI 的账号 JSON 文件。' : '选择 sub2api「账号管理」中导出的原始 JSON 文件。'}</p>
            <div className={`drop-zone${dragging ? ' dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!busy) void importFiles(event.dataTransfer.files); }}>
              <span className="upload-icon">{busy ? <LoaderCircle className="spin" size={24} /> : <Upload size={24} />}</span><strong>{busy ? '正在读取文件…' : '将 JSON 文件拖到这里'}</strong><span className="drop-hint">最多 500 个文件，总计不超过 20 MiB</span>
              <div className="drop-actions"><button className="button secondary" onClick={() => filesRef.current?.click()} disabled={busy}><FileJson size={15} /> 选择文件</button><button className="text-button" onClick={() => folderRef.current?.click()} disabled={busy}><FolderOpen size={16} /> 选择目录</button></div>
              <input ref={filesRef} type="file" accept=".json,application/json" multiple hidden aria-label="选择 JSON 文件" onChange={(event) => { if (event.target.files) void importFiles(event.target.files); event.target.value = ''; }} />
              <input ref={folderRef} type="file" multiple {...{ webkitdirectory: '' }} hidden aria-label="选择 JSON 目录" onChange={(event) => { if (event.target.files) void importFiles(event.target.files); event.target.value = ''; }} />
            </div>
            {sources.length > 0 && <div className="source-list"><div className="source-summary"><Check size={14} /> 已载入 {sources.length} 个文件 <span>{(sources.reduce((n, source) => n + new TextEncoder().encode(source.text).byteLength, 0) / 1024).toFixed(1)} KiB</span></div><ul>{sources.slice(0, 4).map((source, index) => <li key={`${index}-${source.name}`}><FileJson size={13} /><span>{source.name}</span><button className="icon-button" aria-label={`移除文件 ${index + 1}`} disabled={busy} onClick={() => { setSources((previous) => previous.filter((_, i) => i !== index)); invalidate(); }}><X size={13} /></button></li>)}</ul>{sources.length > 4 && <small>另有 {sources.length - 4} 个文件，均将参与转换。</small>}</div>}
            <div className="divider-label"><span /> 或直接粘贴 <span /></div>
            <label className="sr-only" htmlFor="json-input">源 JSON 内容</label><textarea id="json-input" value={paste} spellCheck={false} autoComplete="off" autoCapitalize="off" placeholder={toSub ? '{\n  "type": "codex",\n  "access_token": "…",\n  "refresh_token": "…"\n}' : '{\n  "type": "sub2api-data",\n  "version": 1,\n  "accounts": [ … ]\n}'} onChange={(event) => { setPaste(event.target.value); invalidate(); }} />
            <div className="input-meta"><span>JSON / JSON 数组 / JSONL</span><span>{paste.length.toLocaleString()} 字符</span></div>
            {toSub && <details className="settings"><summary>sub2api 导入设置 <ChevronDown size={14} /></summary><div className="settings-fields"><label>并发数<input type="number" min={1} max={1000} value={settings.concurrency} onChange={(event) => { setSettings((previous) => ({ ...previous, concurrency: event.target.valueAsNumber })); invalidate(); }} /></label><label>优先级<input type="number" min={0} max={100000} value={settings.priority} onChange={(event) => { setSettings((previous) => ({ ...previous, priority: event.target.valueAsNumber })); invalidate(); }} /></label></div><p>应用于生成的账号，浏览器会记住这两项设置。</p></details>}
            <button className="button primary convert-button" disabled={busy || (!sources.length && !paste.trim())} onClick={convert}><ArrowLeftRight size={17} /> 开始转换 <ArrowRight size={17} /></button>
            <div className="input-assurance"><LockKeyhole size={12} /> 文件在本机处理，刷新页面会清空内容。</div>
          </section>

          <section className="output-pane" aria-labelledby="output-title"><div className="section-heading"><h2 id="output-title"><span className="step">02</span> 转换结果</h2><span className={`result-badge${entries.length ? ' ready' : ''}`}>{entries.length ? `已转换 ${entries.length} 个账号` : '等待转换'}</span></div><p className="section-description">{toSub ? '下载合并 JSON，在 sub2api「账号管理」中导入。' : '下载 ZIP，解压后放入 CLIProxyAPI 的认证目录（auth-dir）。'}</p>
            {!result ? <div className="empty-state"><div className="empty-symbol"><Braces size={33} /><span><ArrowLeftRight size={13} /></span></div><h3>等待添加账号文件</h3><p>选择文件或粘贴 JSON，<br />然后点击“开始转换”。</p><div className="empty-flow"><span>添加文件</span><ArrowRight size={13} /><span>转换</span><ArrowRight size={13} /><span>下载</span></div></div> : <>
              <div className="result-summary" aria-live="polite"><span><strong>{entries.length}</strong> 成功</span><span><strong>{result.issues.length}</strong> 跳过</span><span><strong>{warningCount}</strong> 有提示</span></div>
              {result.issues.length > 0 && <details className="issue-list" open={!entries.length}><summary>{result.issues.length} 项未转换 · 查看原因</summary><ul>{result.issues.map((issue, i) => <li key={i}><strong>{issue.source}{issue.position ? ` · 账号 ${issue.position}` : ''}</strong><span>{issue.reason}</span></li>)}</ul></details>}
              {entries.length > 0 && <><div className="result-toolbar"><label className="select-all"><input type="checkbox" aria-label="全选可见账号" checked={visible.length > 0 && visible.every((entry) => selected.has(entry.id))} onChange={(event) => setSelected((previous) => { const next = new Set(previous); for (const entry of visible) if (event.target.checked) next.add(entry.id); else next.delete(entry.id); return next; })} /> 已选 {chosen.length} / {entries.length}</label><label className="sr-only" htmlFor="provider-filter">筛选平台</label><select id="provider-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">全部平台</option>{Object.entries(providerNames).map(([provider, label]) => <option key={provider} value={provider}>{label}</option>)}</select></div>
              <div className="entry-list">{visible.length ? visible.map((entry) => <article className={`entry${selected.has(entry.id) ? ' selected' : ''}`} key={entry.id}><div className="entry-main"><input type="checkbox" aria-label={`选择 ${entry.label}`} checked={selected.has(entry.id)} onChange={() => toggle(entry)} /><span className={`provider-mark ${entry.provider}`}>{providerNames[entry.provider].slice(0, 1)}</span><div className="entry-info"><strong title={entry.label}>{entry.label}</strong><span>{providerNames[entry.provider]} <span>·</span> {entry.source}</span></div><button className="icon-button" aria-label={`下载 ${entry.fileName}`} title="下载账号 JSON" onClick={() => download(JSON.stringify(entry.document, null, 2), entry.fileName)}><ArrowDownToLine size={16} /></button></div><div className="entry-footer"><button className="text-button" onClick={() => { setPreviewId(previewId === entry.id ? null : entry.id); setReveal(false); }}>{previewId === entry.id ? '收起预览' : '预览 JSON'} <Braces size={12} /></button>{entry.warnings.length > 0 && <details className="entry-warnings"><summary>{entry.warnings.length} 条提示</summary><ul>{entry.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></details>}</div></article>) : <p className="no-results">此平台没有转换结果。</p>}</div>
              {preview && <section className="preview-panel" aria-label="JSON 预览"><div className="preview-heading"><span>{reveal ? '凭据已显示' : '已隐藏凭据 · 导入请下载文件'}</span><div><label><input type="checkbox" checked={reveal} onChange={(event) => setReveal(event.target.checked)} /> 显示凭据</label><button className="icon-button" aria-label="复制当前预览" onClick={() => void copyPreview()}><Clipboard size={14} /></button><button className="icon-button" aria-label="关闭预览" onClick={() => { setPreviewId(null); setReveal(false); }}><X size={14} /></button></div></div><pre>{previewText.slice(0, 20000)}{previewText.length > 20000 ? '\n…仅显示前 20,000 字符，下载文件包含全部内容。' : ''}</pre></section>}
              <div className="export-actions">{toSub && <button className="button primary" disabled={!chosen.length} onClick={() => exportSelected('merged')}><ArrowDownToLine size={16} /> 下载合并 JSON</button>}<button className={`button${toSub ? ' secondary' : ' primary'}`} disabled={!chosen.length} onClick={() => exportSelected('zip')}><FolderOpen size={16} /> 下载 ZIP <span>{chosen.length}</span></button></div><p className="export-warning">下载的文件含登录凭证，请勿公开分享。</p></>}
            </>}
          </section>
        </div>
      </section>
      {notice && <div className="notice" role="status"><span>{notice}</span><button className="icon-button" aria-label="关闭提示" onClick={() => setNotice('')}><X size={15} /></button></div>}
      <section className="compatibility"><span className="compatibility-label">支持的账号</span><div>{Object.entries(providerNames).map(([provider, label]) => <span key={provider}><i className={`provider-dot ${provider}`} />{label}</span>)}</div><button className="text-button" onClick={() => setGuide(true)}>查看导入方法 <ArrowRight size={13} /></button></section>
    </main>
    <footer><span>CPA ⇄ sub2api</span><span>OAuth 账号文件转换</span></footer>
    {guide && <ConversionGuide close={() => { setGuide(false); helpRef.current?.focus(); }} />}
  </div>;
}
