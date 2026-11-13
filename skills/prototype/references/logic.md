# Logic prototype

A single self-contained HTML file that lets anyone drive a flow or state model by clicking buttons. Use it when the question is about business logic, state transitions or data shape: things that look reasonable on paper and only feel wrong once pushed through real cases.

Because it is one file with nothing to install, a non-developer can open it and feel the model. Write it in their language, not the code's.

## Build

1. **Put the question at the top of the page**, visibly, not only in a comment.
2. **Isolate the logic in one `<script>` block** as a small pure module: a reducer `(state, action) => state`, an explicit state machine, or a few pure functions over plain data. No DOM access inside it. This is the only part that may be lifted into the real build later.
3. **One file, plain HTML, CSS and JavaScript.** No framework, bundler, server or network calls, so it opens by double click and still works when sent to someone.
4. **Lay it out top to bottom:**
   - title and one line on what this lets you explore;
   - **current state** as a readable panel with labelled fields (not raw JSON), re-rendered after every click, with what just changed called out;
   - **free play**: one button per action, always available;
   - **guided walkthroughs**: a few scenarios as tabs, each with a plain description and its ordered buttons to press. Starting a walkthrough resets to a known state.
5. **Choose scenarios that show the awkward cases:** the happy path, a tricky edge, and something that should be impossible.
6. Keep it restrained: clean type, generous spacing, one accent colour, no animation.

## Avoid

- Tests, persistence, or wiring to real data.
- Generalising for "later". It answers one question.
- Logic that reaches into the page. If the module touches the DOM it cannot be lifted.
- Shipping the HTML shell. Only the validated logic module is worth keeping.
