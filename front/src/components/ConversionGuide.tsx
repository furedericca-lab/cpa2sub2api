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
      <div className="section-heading"><h2 id="guide-title">转换前，了解这些边界</h2><button className="icon-button" aria-label="关闭使用说明" onClick={close} autoFocus><X size={19} /></button></div>
      <p>这里只转换账号文件，不连接服务、不登录账号，也不验证或刷新令牌。</p>
      <h3>CLIProxyAPI → sub2api</h3>
      <p>从 CPA 的 auth-dir 选择原始 JSON，或选择整个目录。下载合并 JSON 后，在 sub2api 的账号管理中导入。</p>
      <h3>sub2api → CLIProxyAPI</h3>
      <p>使用 sub2api 管理员的账号数据导出，不要使用脱敏列表接口。转换后下载 ZIP，解压 JSON 到 CPA 的 auth-dir。</p>
      <h3>支持与限制</h3>
      <p>支持 Codex / OpenAI、Claude / Anthropic、Gemini 和 Antigravity 的 OAuth 账号。API Key、setup-token、upstream、SIWC 及其他平台会报告为跳过。</p>
      <p>并发、优先级、分组、计费和代理绑定不保证跨项目生效。这不是完整配置备份或无损迁移工具。未知 CPA 顶层字段保存在 sub2api extra 元数据中，目标服务不会自动使用它们。</p>
      <p>一次最多 500 个 JSON 文件、总计 20 MiB、5000 个账号。支持 JSON 数组、逐行 JSON 和连续 JSON 对象；不支持 ZIP 导入。重复账号不会自动去重，重名导出会自动编号。</p>
      <div className="privacy-note"><LockKeyhole size={18} /><span>凭据只停留在当前标签页内存中。刷新即清除；仅并发和优先级偏好保存到本机。下载文件和复制内容包含真实凭据，请妥善保管。</span></div>
      <div className="guide-links"><a href="https://github.com/Wei-Shaw/sub2api" target="_blank" rel="noreferrer">sub2api <ArrowUpRight size={13} /></a><a href="https://github.com/router-for-me/CLIProxyAPI" target="_blank" rel="noreferrer">CLIProxyAPI <ArrowUpRight size={13} /></a><a href="https://github.com/gtxx3600/CPA2sub2API" target="_blank" rel="noreferrer">参考项目 <ArrowUpRight size={13} /></a></div>
    </section>
  </div>;
}
