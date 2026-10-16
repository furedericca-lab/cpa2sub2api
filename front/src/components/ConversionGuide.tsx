import { ArrowUpRight, LockKeyhole, X } from 'lucide-react';

export function ConversionGuide({ close }: { close: () => void }) {
  return <div className="dialog-backdrop" onClick={close}>
    <section className="guide-dialog" role="dialog" aria-modal="true" aria-labelledby="guide-title" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
      if (event.key === 'Escape') close();
      if (event.key === 'Tab') {
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, a[href]'));
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      <div className="section-heading"><h2 id="guide-title">使用说明</h2><button className="icon-button" aria-label="关闭使用说明" onClick={close} autoFocus><X size={19} /></button></div>
      <h3>导入 sub2api</h3>
      <p>选择 CLIProxyAPI 的账号 JSON 文件或认证目录（auth-dir）。转换后下载合并 JSON，在 sub2api「账号管理」中导入。</p>
      <h3>导入 CLIProxyAPI</h3>
      <p>在 sub2api「账号管理」中导出原始账号数据。转换后下载 ZIP，解压后将 JSON 文件放入 CLIProxyAPI 的认证目录（auth-dir）。</p>
      <h3>支持哪些账号</h3>
      <p>支持 Codex / OpenAI、Claude / Anthropic、Gemini 和 Antigravity 的 OAuth 账号。API Key、setup-token、upstream 和 SIWC 账号会跳过。</p>
      <h3>导入后的设置</h3>
      <p>sub2api 的并发和优先级可在转换前填写。分组、计费、模型映射和代理请在目标服务中设置。已过期的令牌需由目标服务刷新后使用。</p>
      <h3>文件要求</h3>
      <p>每次最多 500 个 JSON 文件、20 MiB、5000 个账号。支持 JSON 数组、逐行 JSON 和连续 JSON 对象，ZIP 请先解压。重复账号会保留，重名文件会自动编号。</p>
      <div className="privacy-note"><LockKeyhole size={18} /><span>账号内容在当前页面处理，刷新后清空。浏览器仅记住并发和优先级设置。下载文件含登录凭证，请妥善保管；复制的内容与当前预览一致。</span></div>
      <div className="guide-links"><a href="https://github.com/Wei-Shaw/sub2api" target="_blank" rel="noreferrer">sub2api <ArrowUpRight size={13} /></a><a href="https://github.com/router-for-me/CLIProxyAPI" target="_blank" rel="noreferrer">CLIProxyAPI <ArrowUpRight size={13} /></a><a href="https://github.com/gtxx3600/CPA2sub2API" target="_blank" rel="noreferrer">参考项目 <ArrowUpRight size={13} /></a></div>
    </section>
  </div>;
}
