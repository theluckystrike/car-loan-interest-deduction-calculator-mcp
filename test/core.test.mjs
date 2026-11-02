// Fixtures: expected values come from the IRS form lines and tables (cited) checked by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateCarLoanInterestDeduction as car, calculateSaltDeduction as salt, calculateChildTaxCredit as ctc,
  getBracketsAndStandardDeduction as brackets, incomeTax, saltParameters, InputError,
} from "../dist/core.js";

const S = "single", J = "married_filing_jointly", M = "married_filing_separately", H = "head_of_household";

test("F1 Sched 1-A Part IV: single MAGI $110,000, $3,200 interest -> 10 steps x $200 -> $1,200", () => {
  const r = car({ filing_status: S, magi: 110000, tax_year: 2025, interest_paid: 3200 });
  assert.equal(r.phaseout.steps, 10);
  assert.equal(r.phaseout.reduction, 2000);
  assert.equal(r.deduction, 1200);
});

test("F2 cap then phase-out: $12,000 interest, MAGI $149,000 -> $10,000 - 49 x $200 = $200", () => {
  const r = car({ filing_status: S, magi: 149000, tax_year: 2026, interest_paid: 12000 });
  assert.equal(r.amount_after_cap, 10000);
  assert.equal(r.deduction, 200);
});

test("F3 line 28 rounds UP: MAGI $149,001 -> 50 steps -> $0; zero point reported as $149,001", () => {
  const r = car({ filing_status: S, magi: 149001, tax_year: 2026, interest_paid: 12000 });
  assert.equal(r.phaseout.steps, 50);
  assert.equal(r.deduction, 0);
  assert.equal(r.deduction_reaches_zero_at_magi, 149001);
});

test("F4 joint threshold $200,000: MAGI $200,001 -> 1 step -> $9,800", () => {
  assert.equal(car({ filing_status: J, magi: 200001, tax_year: 2027, interest_paid: 10000 }).deduction, 9800);
});

test("F5 MAGI exactly at threshold: no reduction", () => {
  assert.equal(car({ filing_status: S, magi: 100000, tax_year: 2025, interest_paid: 8000 }).deduction, 8000);
});

test("F6 instructions example 0.05 -> 1: MAGI $100,050 -> 1 step -> $4,800", () => {
  assert.equal(car({ filing_status: H, magi: 100050, tax_year: 2025, interest_paid: 5000 }).deduction, 4800);
});

test("F7 married filing separately allowed, $100,000 threshold: MAGI $120,000, $6,000 -> $2,000", () => {
  const r = car({ filing_status: M, magi: 120000, tax_year: 2026, interest_paid: 6000 });
  assert.equal(r.eligible, true);
  assert.equal(r.deduction, 2000);
});

test("F8 ineligible: loan dated 2024-12-31, used vehicle, lease, foreign assembly -> $0", () => {
  assert.equal(car({ filing_status: S, magi: 50000, tax_year: 2025, interest_paid: 3000, loan_origination_date: "2024-12-31" }).deduction, 0);
  assert.equal(car({ filing_status: S, magi: 50000, tax_year: 2025, interest_paid: 3000, new_vehicle: false }).deduction, 0);
  assert.equal(car({ filing_status: S, magi: 50000, tax_year: 2025, interest_paid: 3000, is_lease: true }).deduction, 0);
  const r = car({ filing_status: S, magi: 50000, tax_year: 2025, interest_paid: 3000, us_final_assembly: false, loan_origination_date: "2025-01-01" });
  assert.equal(r.eligible, false);
  assert.equal(r.failed_requirements.length, 1);
});

test("F9 line 22 col (iii): interest deducted on Schedule C is removed first", () => {
  const r = car({ filing_status: S, magi: 60000, tax_year: 2025, interest_paid: 6000, interest_deducted_elsewhere: 1000 });
  assert.equal(r.interest_counted, 5000);
  assert.equal(r.deduction, 5000);
});

test("F10 years: 2029 has no deduction", () => {
  assert.throws(() => car({ filing_status: S, magi: 50000, tax_year: 2029, interest_paid: 3000 }), InputError);
});

test("F11 SALT 2025 under threshold: $30,000 taxes, MAGI $400,000 -> $30,000", () => {
  assert.equal(salt({ filing_status: S, magi: 400000, tax_year: 2025, state_and_local_taxes: 30000 }).deduction, 30000);
});

test("F12 SALT worksheet 2025: MAGI $550,000 -> $40,000 - 30% x $50,000 = $25,000", () => {
  assert.equal(salt({ filing_status: J, magi: 550000, tax_year: 2025, state_and_local_taxes: 45000 }).deduction, 25000);
});

test("F13 SALT floor: MAGI $600,000 and $700,000 -> $10,000", () => {
  assert.equal(salt({ filing_status: S, magi: 600000, tax_year: 2025, state_and_local_taxes: 50000 }).deduction, 10000);
  assert.equal(salt({ filing_status: S, magi: 700000, tax_year: 2025, state_and_local_taxes: 50000 }).deduction, 10000);
});

test("F14 SALT MFS 2025: threshold $250,000, MAGI $300,000 -> ($40,000 - $15,000) / 2 = $12,500", () => {
  assert.equal(salt({ filing_status: M, magi: 300000, tax_year: 2025, state_and_local_taxes: 30000 }).deduction, 12500);
});

test("F15 SALT 2026 draft Schedule A: cap $40,400, MAGI $605,000 -> $10,400", () => {
  assert.equal(salt({ filing_status: S, magi: 400000, tax_year: 2026, state_and_local_taxes: 60000 }).deduction, 40400);
  assert.equal(salt({ filing_status: S, magi: 605000, tax_year: 2026, state_and_local_taxes: 60000 }).deduction, 10400);
});

test("F16 SALT statute 101% steps and 2030 reversion", () => {
  assert.deepEqual([saltParameters(2027).cap, saltParameters(2027).threshold], [40804, 510050]);
  assert.equal(saltParameters(2028).cap, 41212.04);
  assert.equal(saltParameters(2029).cap, 41624.16);
  assert.equal(salt({ filing_status: S, magi: 100000, tax_year: 2030, state_and_local_taxes: 25000 }).deduction, 10000);
  assert.equal(salt({ filing_status: M, magi: 100000, tax_year: 2030, state_and_local_taxes: 25000 }).deduction, 5000);
});

test("F17 SALT taxes under $10,000 are never limited", () => {
  assert.equal(salt({ filing_status: S, magi: 2000000, tax_year: 2026, state_and_local_taxes: 8000 }).deduction, 8000);
});

test("F18 Rev. Proc. 2025-32 Table 3: single $60,000 -> $5,800 + 22% x $9,600 = $7,912", () => {
  assert.deepEqual(incomeTax(60000, S, 2026), { tax: 7912, marginal_rate: 0.22 });
});

test("F19 Rev. Proc. 2025-32 table row starts: MFJ $100,800 -> $11,600; HoH $201,750 -> $39,207; single $640,600 -> $192,979.25; MFJ $768,700 -> $206,583.50", () => {
  assert.equal(incomeTax(100800, J, 2026).tax, 11600);
  assert.equal(incomeTax(201750, H, 2026).tax, 39207);
  assert.equal(incomeTax(640600, S, 2026).tax, 192979.25);
  assert.equal(incomeTax(768700, J, 2026).tax, 206583.5);
});

test("F20 Rev. Proc. 2024-40 Table 3: 2025 single $50,000 -> $5,578.50 + 22% x $1,525 = $5,914", () => {
  assert.equal(incomeTax(50000, S, 2025).tax, 5914);
});

test("F21 standard deductions 2026 / 2025 and 2027 not published", () => {
  const r = brackets({ tax_year: 2026 });
  assert.deepEqual(r.tables.map((t) => t.standard_deduction), [16100, 32200, 16100, 24150]);
  assert.equal(brackets({ tax_year: 2025, filing_status: H }).tables[0].standard_deduction, 23625);
  assert.equal(r.additional_standard_deduction_65_or_blind.unmarried, 2050);
  assert.throws(() => brackets({ tax_year: 2027 }), InputError);
});

test("F22 Schedule 8812 phase-out: MFJ MAGI $410,500, 2 children -> excess rounds to $11,000 -> $4,400 - $550 = $3,850", () => {
  const r = ctc({ filing_status: J, magi: 410500, tax_year: 2026, qualifying_children: 2, tax_liability_before_credits: 50000 });
  assert.equal(r.phaseout.excess_rounded_up, 11000);
  assert.equal(r.credit_after_phaseout, 3850);
  assert.equal(r.total_benefit, 3850);
});

test("F23 Schedule 8812 line 10: $1 over $200,000 rounds to $1,000 -> $50 reduction", () => {
  assert.equal(ctc({ filing_status: S, magi: 200000, tax_year: 2025, qualifying_children: 1, tax_liability_before_credits: 30000 }).credit_after_phaseout, 2200);
  assert.equal(ctc({ filing_status: S, magi: 200001, tax_year: 2025, qualifying_children: 1, tax_liability_before_credits: 30000 }).credit_after_phaseout, 2150);
});

test("F24 ACTC: 2 children, earned $20,000, tax $500 -> $500 + min($3,400, 15% x $17,500 = $2,625)", () => {
  const r = ctc({ filing_status: J, magi: 20000, tax_year: 2026, qualifying_children: 2, earned_income: 20000, tax_liability_before_credits: 500 });
  assert.equal(r.nonrefundable_credit, 500);
  assert.equal(r.additional_child_tax_credit, 2625);
});

test("F25 ACTC capped at $1,700 per child: 3 children, $60,000 earned, $0 tax -> $5,100", () => {
  const r = ctc({ filing_status: H, magi: 60000, tax_year: 2025, qualifying_children: 3, earned_income: 60000, tax_liability_before_credits: 0 });
  assert.equal(r.additional_child_tax_credit, 5100);
  assert.equal(r.unused_credit, 1500);
});

test("F26 other dependents $500 each are not refundable", () => {
  const r = ctc({ filing_status: S, magi: 30000, tax_year: 2026, qualifying_children: 0, other_dependents: 1, tax_liability_before_credits: 0 });
  assert.equal(r.credit_before_phaseout, 500);
  assert.equal(r.total_benefit, 0);
});
