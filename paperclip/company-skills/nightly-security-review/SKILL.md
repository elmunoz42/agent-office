---
name: nightly-security-review
description: Diff-based security review of what changed on the main branch since the last audit, including dependency and supply-chain changes and secrets. Report only. Use for the scheduled nightly security audit, or when asked to security-review a range of commits.
---

# Nightly security review

Review only what changed, thoroughly, and report. Never change code, credentials, dependencies or infrastructure, and never quote a secret value: say where it is.

## 1. Scope

Read the last audited commit from the audit state document named in the task. List the change with `git log --oneline <last>..main` and `git diff --stat <last>..main`. If nothing changed, say so and stop. Use the git command the project's AGENTS.md specifies.

## 2. Code

Read the full diff, then the surrounding code of every changed function. Use the security best-practices skill's references for the stack (for Next.js, its Next.js reference). Look first at:

- new or changed routes and API handlers: input validation, authorization, error messages that leak internals;
- data from outside (APIs, CMS content, query strings) reaching HTML, URLs, file paths, shell commands or queries;
- server/client boundaries: secrets or server-only data reaching client bundles, `NEXT_PUBLIC_` variables;
- caching of personalised or private data; CORS and security headers;
- anything that reads environment variables or files.

## 3. Dependencies and supply chain

Diff `package.json` and the lockfile across the range. For each added or upgraded package: why it was added (find the import), whether it is the expected package name (typosquats), whether it has install scripts (check the lockfile's `hasInstallScript`), and its maintenance and download standing if you can check it. Run `npm audit --omit=dev` if it works offline from the existing install; if it cannot run, say so rather than guessing.

## 4. Secrets

Search the diff for credentials: keys, tokens, passwords, private keys, connection strings, `.env` files, and long random strings in config or tests. A secret in history stays exposed even after deletion: report it as needing rotation by the board.

## 5. Report

For each finding: ID, severity (critical, high, medium, low), file and line, what an attacker could do, the smallest fix, and whether it is confirmed or suspected. Separate findings from hardening suggestions. End with what you did not check and why. Then follow the task's instructions for fix tasks and updating the audit state.
