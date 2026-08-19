# Teletubby

An open-source teleprompter that you **glance at**, not read from.

Standard teleprompters make you recite. Teletubby is built on the opposite bet: the
words that come out of your mouth should be *yours*, and the screen's job is only to
keep you on track. It does that with three columns instead of one scrolling wall of text.

```
┌──────────────┬─────────────────────┬────────────────────────────┐
│ 1. TOPIC     │ 2. TRIGGERS         │ 3. TRANSCRIPT              │
│              │                     │                            │
│ Intro        │ • memory fades      │ "Most teleprompters make   │
│ The problem  │ • not my voice      │  you recite someone else's │
│ The 3 cols   │ • glance not read   │  sentences. That's the     │
│ Close        │                     │  part that breaks..."      │
│              │                     │                            │
│ where you    │ where your EYES     │ the safety net you read    │
│ are          │ live while talking  │ BEFORE you hit record      │
└──────────────┴─────────────────────┴────────────────────────────┘
```

**Column 2 is the product.** Everything else is context.

## Why it exists

David's own constraint, stated plainly: *"my memory is going — I can't hold recited
sentences in my head."* Scripts written by someone (or something) else don't come out
naturally, because they aren't in his voice. Reading verbatim looks like reading
verbatim. The fix isn't a better script — it's needing less of it on screen.

## Status

🌱 **Seed.** No code yet. This repo currently holds the concept, the source
brainstorm, and the open questions.

## Docs

| Doc | What's in it |
|---|---|
| [docs/concept.md](docs/concept.md) | The three-column model, the AI layer, FliHub integration |
| [docs/open-questions.md](docs/open-questions.md) | What's genuinely unresolved — trigger words, scrolling, scope |
| [docs/source/b421-2026-08-19-plaud.md](docs/source/b421-2026-08-19-plaud.md) | Raw origin brainstorm (Captain's Log B421) |
| [docs/prior-art-kybernesis-prompter.md](docs/prior-art-kybernesis-prompter.md) | A working two-column prompter built the day before — what it settled, what it didn't |

## Setup on another machine

Canonical location — **do not clone it anywhere else**, several docs reference this path:

```
~/dev/ad/apps/teletubby          # git@github.com:appydave/teletubby.git
```

Jump alias: **`japp-teletubby`** (registry key `teletubby`). It follows the `japp-<name>`
convention shared by the other `~/dev/ad/apps` entries, kept whole rather than shortened
because the name carries no redundant prefix — same class as `japp-thumbrack`.

**The alias is already registered and pushed**, so another machine does not re-add it —
it pulls it. The registry is git-synced; only the generated shell file is per-machine:

```bash
git -C ~/.config/appydave pull                     # locations.json — source of truth, synced
cd ~/dev/ad/apps && gh repo clone appydave/teletubby

# regenerate this machine's shell aliases from the registry
~/dev/ad/appydave-tools/bin/jump.rb generate aliases > /tmp/aliases-jump.zsh
diff ~/.oh-my-zsh/custom/aliases-jump.zsh /tmp/aliases-jump.zsh    # expect only additions
cp /tmp/aliases-jump.zsh ~/.oh-my-zsh/custom/aliases-jump.zsh
source ~/.oh-my-zsh/custom/aliases-jump.zsh
```

Three ways this goes wrong, all seen before:

- **Never edit `aliases-jump.zsh` by hand.** It is generated; `locations.json` is the
  source of truth and a hand edit is silently overwritten on the next regen.
- **Generate to a temp file and diff before copying.** Redirecting straight onto the real
  file truncates it the moment the generator errors, and you lose every alias at once.
- **Over SSH, initialise rbenv first.** A non-login shell on the Minis can land on system
  Ruby 2.6, where `jump.rb` fails — combined with the point above, that is exactly how the
  alias file gets wiped.

If `japp-teletubby` is missing after all that, the registry pull is what failed, not the
clone — check `~/.config/appydave` is on `origin/main` before regenerating again.

## Related

- **Kybernesis** — the video channel this was conceived to serve
- **FliHub** (`~/dev/ad/flivideo/flihub`) — per-section recordings get captured and stitched there
