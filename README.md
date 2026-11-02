# car-loan-interest-deduction-calculator-mcp

An MCP server that calculates the 2025-2028 car loan interest deduction, the new SALT cap, the $2,200 child tax credit and the 2025 and 2026 federal brackets from the One Big Beautiful Bill Act (P.L. 119-21), using IRS forms and revenue procedures.

Hosted endpoint, no sign-in and no token:

```
https://car-loan-interest-deduction-calculator-mcp.lipmichal.workers.dev/mcp
```

## Tools

| Tool | What it does |
|---|---|
| `calculate_car_loan_interest_deduction` | Deduction for car loan interest after the $10,000 cap and the $200-per-$1,000 MAGI phase-out over $100,000 ($200,000 joint). Checks the vehicle and loan tests: new, US final assembly, personal use, loan after 2024, under 14,000 lb, first lien, not a lease. |
| `calculate_salt_deduction` | Deductible state and local tax under the $40,000 (2025) and $40,400 (2026) cap, the 30% phase-down over $500,000 / $505,000 MAGI and the $10,000 floor. Covers 2027-2029 steps and the 2030 return to $10,000. Optionally compares itemizing with the standard deduction. |
| `get_tax_brackets_and_standard_deduction` | 2025 and 2026 brackets and standard deductions, the extra amount for age 65 or blind, and the tax and marginal rate on a given taxable income. |
| `calculate_child_tax_credit` | $2,200 per child and $500 per other dependent, the 5% phase-out, the tax liability limit and the refundable part up to $1,700 per child. |

Every result has structured JSON, a plain-English summary, `as_of`, `source` (the irs.gov document) and `more` (a calculator page on taxbreakcalc.com).

## What it knows that your model does not

- The car loan interest deduction started in tax year 2025, after most models were trained. You can take it without itemizing.
- Its phase-out is $200 for each $1,000 or part of $1,000 over the threshold. One dollar over $149,000 (single) wipes out the last $200. Schedule 1-A line 28 rounds up.
- Only new vehicles with final assembly in the US qualify, the loan must be originated after December 31, 2024, and leases never count.
- Married filing separately can claim it, with the same $100,000 threshold as single filers.
- The SALT cap is $40,000 for 2025 and $40,400 for 2026, not $10,000. Above $500,000 of MAGI it shrinks by 30 cents per dollar, but never below $10,000.
- The 2026 standard deduction is $16,100 single and $32,200 joint (Rev. Proc. 2025-32). The child tax credit is $2,200, with up to $1,700 refundable.
- The IRS has not published 2027 amounts yet (checked 2026-11-02). The tools say so instead of guessing.

## Install

### Claude.ai custom connector or ChatGPT developer mode

Add a custom connector and paste the URL. No token is needed.

```
https://car-loan-interest-deduction-calculator-mcp.lipmichal.workers.dev/mcp
```

### Claude Code

```
claude mcp add --transport http car-loan-interest-deduction https://car-loan-interest-deduction-calculator-mcp.lipmichal.workers.dev/mcp
```

Or run it locally:

```
claude mcp add car-loan-interest-deduction -- npx -y github:theluckystrike/car-loan-interest-deduction-calculator-mcp
```

### Claude Desktop

Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "car-loan-interest-deduction": {
      "command": "npx",
      "args": ["-y", "github:theluckystrike/car-loan-interest-deduction-calculator-mcp"]
    }
  }
}
```

### Cursor

Add this to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "car-loan-interest-deduction": {
      "url": "https://car-loan-interest-deduction-calculator-mcp.lipmichal.workers.dev/mcp"
    }
  }
}
```

### VS Code

Add this to `.vscode/mcp.json`:

```json
{
  "servers": {
    "car-loan-interest-deduction": {
      "type": "http",
      "url": "https://car-loan-interest-deduction-calculator-mcp.lipmichal.workers.dev/mcp"
    }
  }
}
```

Node 20 or newer is needed for the local `npx` version.

## Example prompts

- "I bought a new Ford F-150 in March 2026 and paid $3,200 in loan interest. I file single with MAGI of $110,000. What can I deduct?"
- "Does a used car or a leased car qualify for the no tax on car loan interest deduction?"
- "We file jointly, MAGI $550,000, and paid $48,000 in state income and property tax in 2026. How much SALT can we deduct, and should we itemize?"
- "What is the 2026 standard deduction and what is my federal tax on $60,000 of taxable income?"
- "We have two kids under 17 and MAGI of $410,500. What is our 2026 child tax credit?"

## Data sources

All numbers come from documents fetched on 2026-11-02: the 2025 Schedule 1-A and Form 1040 instructions, IRS Notice 2025-57, the 2025 Schedule A instructions and 2026 draft Schedule A, IRC 164(b)(7), Rev. Proc. 2024-40, Rev. Proc. 2025-32 and the 2025 Schedule 8812 with its instructions. See [DATA_SOURCES.md](DATA_SOURCES.md) for each item and URL.

## Limitations

- Results are estimates, not tax advice.
- Federal income tax only. State taxes on the same items are not covered.
- It does not look up a VIN. Check final assembly on the vehicle label or the NHTSA VIN decoder.
- 2027-2029 SALT amounts follow the statute's 101% rule; the IRS may round them when it prints the forms.
- The child tax credit tool does not model the Schedule 8812 alternative for three or more children based on social security and Medicare tax.
- Overtime, tips and the senior deduction are in a separate server: [no-tax-on-overtime-mcp](https://github.com/theluckystrike/no-tax-on-overtime-mcp).

## More

Calculators and guides for people: [taxbreakcalc.com](https://taxbreakcalc.com/car-loan-interest-calculator/?utm_source=mcp&utm_medium=car-loan-interest-deduction-calculator-mcp).

Part of the Zovo MCP collection: https://mcp.zovo.one

## Development

```
npm install
npm run build
npm test
```

`src/core.ts` holds all the rules and has no I/O. `src/stdio.ts` is the local entry and `src/worker.ts` is the Cloudflare Worker entry. Both use the same tool registry in `src/tools.ts`.

## License

MIT
