// GET / page for the hosted Worker.
const TOOLS = [
    ["calculate_car_loan_interest_deduction", "2025-2028 car loan interest deduction: $10,000 cap, $200 per $1,000 MAGI phase-out over $100,000 / $200,000, and the vehicle tests (new, US final assembly, personal use, loan after 2024)."],
    ["calculate_salt_deduction", "SALT cap of $40,000 (2025) and $40,400 (2026), 30% phase-down over $500,000 / $505,000 MAGI, $10,000 floor, 1% steps to 2029, $10,000 again in 2030."],
    ["get_tax_brackets_and_standard_deduction", "2025 and 2026 federal brackets and standard deductions from Rev. Proc. 2024-40, the 1040 instructions and Rev. Proc. 2025-32, with tax on a given income."],
    ["calculate_child_tax_credit", "$2,200 child tax credit with the 5% phase-out, the tax liability limit and the refundable part up to $1,700 per child."],
];
function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
export function landingPage(origin) {
    const mcp = `${origin}/mcp`;
    const rows = TOOLS.map(([n, d]) => `<tr><td><code>${n}</code></td><td>${esc(d)}</td></tr>`).join("");
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Car Loan Interest Deduction MCP</title>
<meta name="description" content="MCP server for the 2025-2028 car loan interest deduction, the SALT cap, the child tax credit and 2026 brackets, with IRS caps and phase-outs.">
<style>:root{--bg:#fff;--fg:#1a1a1a;--muted:#555;--line:#ddd;--code:#f4f4f4}
@media (prefers-color-scheme:dark){:root{--bg:#141414;--fg:#eee;--muted:#aaa;--line:#333;--code:#222}}
body{background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,sans-serif;max-width:760px;margin:0 auto;padding:24px 16px}
code,pre{background:var(--code);border-radius:4px;font-size:14px}pre{padding:10px;overflow-x:auto}code{padding:1px 4px}
table{border-collapse:collapse;width:100%}td{border-top:1px solid var(--line);padding:8px 6px;vertical-align:top}p.small{color:var(--muted);font-size:14px}a{color:inherit}</style></head>
<body><h1>Car Loan Interest Deduction MCP server</h1>
<p>Gives an AI assistant the federal tax breaks from the One Big Beautiful Bill Act (P.L. 119-21) that are newer than most models: the 2025-2028 car loan interest deduction, the higher SALT cap, the $2,200 child tax credit and the 2026 brackets, with caps and phase-outs copied from irs.gov.</p>
<h2>Connect</h2>
<p>Hosted endpoint (Streamable HTTP, no sign-in, no token). Paste it into Claude.ai custom connectors or ChatGPT developer mode.</p>
<pre>${esc(mcp)}</pre>
<p>Claude Code</p><pre>claude mcp add --transport http car-loan-interest-deduction ${esc(mcp)}</pre>
<p>Local (stdio)</p><pre>npx -y github:theluckystrike/car-loan-interest-deduction-calculator-mcp</pre>
<h2>Tools</h2><table>${rows}</table>
<p>Calculators for people: <a href="https://taxbreakcalc.com/car-loan-interest-calculator/?utm_source=mcp&amp;utm_medium=car-loan-interest-deduction-calculator-mcp">taxbreakcalc.com</a>.
Source: <a href="https://github.com/theluckystrike/car-loan-interest-deduction-calculator-mcp">github.com/theluckystrike/car-loan-interest-deduction-calculator-mcp</a>.</p>
<p class="small">Results are estimates, not tax advice. Part of the Zovo MCP collection: <a href="https://mcp.zovo.one">mcp.zovo.one</a>.</p>
</body></html>`;
}
