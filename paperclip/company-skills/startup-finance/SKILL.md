---
name: startup-finance
description: Finance for a tiny, pre-revenue software company run by AI agents. Track AI and agent spend (cost per task, per agent, against plan and quota limits), keep a monthly budget and runway forecast, and produce a light P&L from vendor costs. Use for the weekly finance report, budget questions, "can we afford" questions, and any request about tokenomics, AI costs or burn.
---

# Startup finance

The company is small and early: costs are mostly hosting and AI agent usage, revenue is zero or close to it. Keep the numbers simple, sourced and honest. Every figure is labelled **measured** (read from a system), **estimated** (derived) or **assumed** (no source yet), with where it came from.

## AI and agent spend ("tokenomics")

1. **Collect** for the period: the AI connection's usage and limits (plan, percent used per window, reset times), Paperclip cost and spend per agent, and the tasks completed per agent (issues moved to done). Note runs that failed or stalled because a quota ran out.
2. **Unit costs**: cost per completed task, per agent, and per slice shipped (merged by QA). On a flat subscription the marginal cost is quota, not dollars: express it as share of the quota window used per task, and say which agents use the most.
3. **Quota pressure**: how often work stopped on a limit, and how many hours were lost. This is the hidden cost of a cheap plan; compare it with the price of the next plan up.
4. **Recommend** at most three changes with their expected effect: model or effort choices, fewer or merged routine runs, task sizing, a plan change. Never change accounts or plans yourself.

## Budget and runway

- Keep one table per month: line item, owner, monthly cost, source, measured or estimated. Use the cost model the company already has as the starting point and correct it from measurements.
- Forecast month end from the run rate so far. Runway = cash available / net monthly burn; if cash is unknown, say so and give burn only.
- Flag any line that grew more than 20% week on week, any unknown or TBD cost (for example infrastructure registry entries without details), and anything that would breach the monthly ceiling.

## Light P&L

Revenue (by source, or none) minus costs by category (hosting, AI and agents, tools and subscriptions, domains, other) for the week and month to date. Without invoices, use list prices and say they are list prices.

## Output

A short report with: headline (spend vs ceiling, forecast, runway), unit economics, quota pressure, P&L, risks, and recommendations. Put tables first, prose second. Do not include secrets, card numbers or account IDs.
