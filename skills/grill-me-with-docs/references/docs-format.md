# Docs format

## Glossary: `agent-os/product/glossary.md`

```markdown
# Glossary

{One or two sentences on what this product is.}

## Language

**Celestial body**:
A planet, moon or star shown on the map, with its own page of facts and news.
_Avoid_: object, entity, node

**Mission**:
A spaceflight programme or flight with coverage on the site, linked to the bodies it visits.
_Avoid_: project, launch (a launch is one event within a mission)
```

Rules:

- Be opinionated: where several words exist for one thing, pick one and list the rest under _Avoid_.
- One or two sentences per term. Say what it is, not what it does.
- Only terms specific to this product. General programming words do not belong.
- No implementation details, plans or decisions. It is a glossary and nothing else.
- Group terms under subheadings once natural clusters appear.

## Decision record: `agent-os/decisions/NNNN-short-slug.md`

Numbered in sequence (`0001-`, `0002-`). Write one only when all three hold: hard to reverse, surprising without context, the result of a real trade-off.

```markdown
# {Short title of the decision}

- Date: 2026-11-12
- Status: accepted
- Decided by: {who}

## Context

{What forced a decision, in a few sentences.}

## Decision

{What was chosen.}

## Alternatives

- {option}: {why not}

## Consequences

- {what this makes easier, and what it makes harder}
```

A later decision that replaces this one gets its own record, and this one's status becomes `superseded by NNNN`. Do not rewrite history.
