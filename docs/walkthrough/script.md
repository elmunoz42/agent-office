# Agent Office + Agent OS on Paperclip: narration script

## 1

This is a five minute tour of three pieces that now work together. Paperclip, which runs an A.I. company. Agent OS, the planning and testing system that lives in each code repository. And Agent Office, a 3D office where you can walk up to every agent. The example throughout is Space Exploration News.

## 2

Paperclip is the control plane. It holds the company, its agents and every task, which Paperclip calls an issue. It wakes each agent on OpenAI Codex, inside a sandbox, when work arrives. Agent OS lives inside the project repository: coding standards, short slice files, user stories, and skills that tell agents how to plan, build and verify. Agent Office is a window onto Paperclip. Everything in it is live data.

## 3

Here is one loop that actually ran. The board asked Richard, the CEO, for a star map. Richard split it into tasks for Dinesh, the frontend developer, who built it. Carla, in QA, wrote user stories and tested them in a real browser. She found the Moon view was broken, marked the story failing, and filed a fix for Dinesh. He fixed it, and Carla verified it again on her own. Nobody marks their own work as done.

## 4

In Paperclip, that loop is just issues. Each has an owner, a status, comments, and documents such as the plan or the verification report. Dependencies are real: a task waits until its prerequisite is done. Agents are woken automatically when work is assigned or a comment arrives, and they can put questions to the board when a decision is needed.

## 5

The biggest change in Agent OS is that spec folders are gone. They duplicated what Paperclip already tracks, so the two drifted apart. Now each fact has one owner. Paperclip owns the plan, the owner, the status and the dependencies. A slice file in the repository owns what the user gets and why, and links to its issue. User stories own what working means. A migration script turns old specs into legacy slices, archives the originals unedited, and can be rolled back.

## 6

The skills changed too. Shape slice replaces shape spec. Verify stories now posts its results to the Paperclip task. Code review and diagnose bug were added for everyone, adapted from Matt Pocock's skills, and Jian-Yang has Cloudflare's security audit. Three skills belong to Richard alone, delivered through Paperclip rather than the repository: prototype, grill me with docs, which interviews the board until a plan is settled, and graduate prototype.

## 7

Prototype is the one sanctioned shortcut. When you have an idea, Richard can take a first pass on his own, with no slice, no stories and no tests. Here he built a mission timeline in under three minutes: a single page you drag through the years to see where missions were active. Two rules keep this safe. Prototype code never ships, and Richard cannot validate his own prototype. Only the board can.

## 8

When you validated it, Richard ran graduate prototype. He first asked which variant you meant, then wrote slice four and two user stories from what you approved, listed everything the prototype had faked, and created four linked tasks. Gilfoyle supplies the real mission data, Dinesh rebuilds it properly, Tabs reviews the code, and Carla runs QA. Each waits for the one before it, and the prototype stays only as a reference.

## 9

Now Agent Office. It's a small house you walk through: the CEO and CFO offices, marketing, a bullpen with the developers, QA and security at their own desks, contractors at a shared standing table, a kitchen, and a garage server room. Every desk belongs to a Paperclip agent, and characters type only while their agent is actually running.

## 10

Each desk has a whiteboard. Press F for that agent's Kanban board or Gantt chart, built from their Paperclip issues. Drag a card and the issue's status changes in Paperclip. Press E to talk. Quick questions are answered instantly from the board. Anything you type goes to the real agent, with live progress while it works, and replies you miss are waiting next time.

## 11

In the garage, each server rack is drawn from a lookup table that Gilfoyle owns, kept as a document in Paperclip. Today that's two EC2 instances, Amplify, Gmail and OpenAI. Edit the table in the office or in Paperclip, and the racks rebuild themselves.

## 12

On this Mac, Paperclip runs as a background service that starts at login and restarts itself. The projects moved out of Desktop, because macOS blocks background services from reading it. Agents run sandboxed, so two small helpers run beside Paperclip: a browser service they connect to over localhost, and an app service that serves the latest build for testing. The office runs from its dev server.

## 13

To adapt this to another project, there are four steps. One: install Agent OS in the repository with the install or migrate script, set the tracker to Paperclip, and leave out the CEO only skills. Two: create a Paperclip company. The seed script is a template for goals, agents and a starter backlog; each agent gets the repository as its working folder and an office I.D. for its desk. Three: in the office, edit the roster and desk positions in one data file. Four: point the QA services and the testing file at the new project.

## 14

Where it stands: this is a working demo on one machine, not yet a robust product. The whole loop has run for real. The limits are practical: the Codex plan runs out of quota quickly, the QA helpers stop on a restart, agents haven't committed their own work yet, and their results still need a second look. Next up is resuming Gilfoyle's data task, so the mission timeline can be built properly. Thanks for watching.

