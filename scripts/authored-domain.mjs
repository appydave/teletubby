/**
 * AUTHORED DOMAIN DATA — the half of the domain model that is written by hand.
 *
 * `build-scripts-data.mjs` owns the per-paragraph headings and the trigger set.
 * This file owns the three things the old shape could not carry:
 *
 *   1. MAJORS   — the major-topic grouping. Requirements §1 needs two heading
 *                 levels; the shipped data had one. The existing per-paragraph
 *                 headings become MINOR topics, and each script's minors are
 *                 grouped under 2–3 majors here.
 *
 *                 ⚠️ These are groupings of headings that were already
 *                 approved, not new claims about the content. Column 1 is a
 *                 display column and nothing generates it automatically —
 *                 authoring it by hand is the established practice, not a
 *                 shortcut.
 *
 *   2. CADENCE  — the re-cadenced transcripts for scripts 1–3, quoted verbatim
 *                 from `~/dev/ad/brains/kybernesis/phase-1-scripts/v0N-rewrite.txt`.
 *                 They are a DIFFERENT CORPUS of the same script, with their own
 *                 paragraph structure — v02 re-cadences four paragraphs into
 *                 three, which is exactly why a transcript owns its own topics
 *                 rather than borrowing the script's.
 *
 *   3. TALENTS  — the measured cadence envelope. One per person, never ported.
 */

/**
 * Major topics, as `[heading, minorCount]` pairs consumed in order.
 *
 * The minor headings come from `AUTHORED[n].headings` in the sibling file; the
 * counts here have to sum to that array's length, and the build fails loudly
 * if they do not.
 */
export const MAJORS = {
  1: [
    ['The gap', 1],
    ['What we actually build', 2],
    ['Start small', 1],
  ],
  2: [
    ['The pilot that stalled', 2],
    ['Why the next ask restarts', 1],
    ['Build it differently', 1],
  ],
  3: [
    ['What "it remembers" is heard as', 2],
    ['What governed means', 1],
    ['The point', 1],
  ],
  4: [
    ['What Arcana is', 2],
    ['Structured, not a pile', 1],
    ['The payoff', 1],
  ],
  5: [
    ['A fair question', 2],
    ['Where one assistant breaks', 2],
    ['The reframe', 1],
  ],
  6: [
    ['Which one do I ask?', 1],
    ['What an orchestrator does', 2],
    ['The payoff', 1],
  ],
  7: [
    ['One agent sounds simpler', 2],
    ['Why narrow beats broad', 2],
    ['Why it matters', 1],
  ],
  8: [
    ['A concrete example', 2],
    ['How it actually works', 2],
    ['The pattern', 1],
  ],
  9: [
    ['The management problem', 2],
    ['One question, one place', 2],
    ['The point', 1],
  ],
  10: [
    ['It works, nobody uses it', 1],
    ['Meet them where the work happens', 3],
    ['The payoff', 1],
  ],
  11: [
    ['How the morning starts', 1],
    ['What the agents did overnight', 2],
    ['Start on decisions', 1],
  ],
  12: [
    ['How should you start?', 2],
    ["What we'd recommend", 2],
    ['The close', 1],
  ],
};

/**
 * The re-cadenced corpus. Paragraphs are quoted VERBATIM from the committed
 * rewrites — retyping them is exactly the drift the source-JSON rule exists to
 * prevent, so treat any edit here as a provenance bug.
 *
 * Measured against David's envelope (brief §1):
 *   mean breath group  7.30 → 11.17   ·   breaks/100w  7.89 → 3.58
 *   sentence-length SD 8.53 → 14.77   ·   Tom's word types retained 91–96%
 *
 * ⚠️ These were rewritten BY HAND against the gate. The acceptance test exists;
 * the generator does not. Nothing in this repo produces them.
 */
export const CADENCE = {
  1: {
    corpus: 'v01-rewrite',
    source: '~/dev/ad/brains/kybernesis/phase-1-scripts/v01-rewrite.txt',
    majors: [
      ['The gap', 1],
      ['What we actually build', 2],
      ['Start small', 1],
    ],
    minors: ['The gap', 'What an agent is', 'The shared foundation', 'Start small'],
    paragraphs: [
      "So here's a question. You've got an AI assistant at work and it'll answer just about anything you ask it, but can it actually go and do the job? That's the gap.",
      'What Kybernesis builds is a full agent system, and I want to gloss that word agent for a second because everyone uses it differently, but an agent is really just software that can take an action on your behalf and not only answer a question.',
      "Now the way we start is with one agent solving one problem that's genuinely worth solving, and then underneath it we put a shared foundation, and that's your memory and your permissions and your tools and your coordination. And that's the part that matters, because once the foundation is there the second agent and the third agent just plug into it instead of starting over.",
      "So you get to start small without thinking small. That's the whole idea.",
    ],
  },
  2: {
    corpus: 'v02-rewrite',
    source: '~/dev/ad/brains/kybernesis/phase-1-scripts/v02-rewrite.txt',
    // Four of Tom's paragraphs become three. A cadence transcript is not a
    // paragraph-for-paragraph translation, which is why the map belongs to the
    // trigger set and the trigger set belongs to the transcript.
    majors: [
      ['The pilot that stalled', 1],
      ['Why the next ask restarts', 1],
      ['Build it differently', 1],
    ],
    minors: ['The familiar story', 'Why it stalls', 'Build it differently'],
    paragraphs: [
      "Do you ever get that thing where the AI pilot went really well and everyone was impressed, and then six months later nobody's using it? That happens a lot.",
      "It's usually not because the technology failed, it's because the pilot got built as a demo, and a demo is fine as far as it goes, but it's got no durable memory and no real permissions model and no path at all to add a second use case. So when somebody asks for the next thing you're not extending anything. You're starting again.",
      "What we'd do differently is build that first use case so it earns its keep straight away, but it sits on foundations you can actually build on afterwards. Same first project, very different second project. The architecture of the first agent is what decides whether the next one is an extension or a restart.",
    ],
  },
  3: {
    corpus: 'v03-rewrite',
    source: '~/dev/ad/brains/kybernesis/phase-1-scripts/v03-rewrite.txt',
    majors: [
      ['What "it remembers" is heard as', 2],
      ['What governed means', 1],
      ['The point', 1],
    ],
    minors: ['The misunderstanding', 'Both ways it breaks', 'What governed means', 'The point'],
    paragraphs: [
      "Let's talk about memory, because I reckon it's the most misunderstood part of all of this, and when people hear that the agent remembers what they usually hear is that the agent keeps everything. That's not what we want at all.",
      "Here's the problem. Without memory your agent forgets the context every single time so you end up re-explaining your business on every interaction, but with unrestricted memory it might hold on to things it shouldn't or surface them to somebody who was never meant to see them.",
      "So governed memory is the middle path, and governed just means there are rules about what gets stored and who's allowed to use it and how it's organised. The agent gets continuity and you keep control of what it's actually retaining.",
      "Useful memory isn't just memory that persists. It's memory that's structured and controlled.",
    ],
  },
};

/**
 * Talents and their measured envelopes.
 *
 * ⚠️ These numbers belong to ONE PERSON. Applying David's envelope to Alex makes
 * the gate meaningless (requirements §9, brief §3). AITLDR has a verbal style
 * but no measured envelope, so Alex is deliberately absent — an unmeasured
 * talent with borrowed thresholds is worse than no talent at all.
 *
 * Thresholds and word lists are a faithful transcription of
 * `~/dev/ad/brains/kybernesis/phase-1-scripts/score.py`.
 */
export const TALENTS = [
  {
    id: 'david',
    name: 'David Cruwys',
    envelope: {
      wordsMin: 140,
      wordsMax: 155,
      breathGroupMeanMin: 10.0,
      breaksPer100Max: 4.5,
      sentenceSdMin: 13,
      emDashMax: 0,
      antiVoice: [
        'game changing',
        'revolutionary',
        'ultimate',
        'supercharge',
        'unleash',
        'unlock',
        'seamless',
        '10x',
        'mind blowing',
        'fast paced',
      ],
      bookends: ['appydave', 'like and subscribe', 'see you in the next video'],
      source:
        'Measured from 318 punctuated transcripts / ~229,105 words of David’s own published video via verbal-style-forge; thresholds transcribed from ~/dev/ad/brains/kybernesis/phase-1-scripts/score.py (2026-08-19). Native cadence: 11.5-word breath groups, 3.27 breaks per 100 words.',
    },
  },
];

export const SET = {
  id: 'kybernesis-phase-1',
  title: 'Kybernesis — Phase 1',
  description:
    'The twelve Phase 1 explainers handed over by Tom Lane. Provenance transcripts are his approved originals; scripts 1–3 also carry a re-cadenced transcript voiced for David.',
};

/**
 * TRIGGER SETS — the A/B/C experiment, authored by hand.
 *
 * Keyed `script number → corpus → style`, each entry `[text, paragraphNumber]`
 * with a 1-based paragraph index into THAT transcript.
 *
 * ⚠️ **These are candidates to be tested on camera, not an answer.** The North
 * Star is explicit that what a trigger word actually is gets settled by the
 * talent recording takes, and *never by argument*. Nothing here settles it.
 * Throwing a set out costs one edit to this file.
 *
 * The three styles, from requirements §5 — each has a scenario it is right for,
 * which is why all three exist rather than one winning:
 *
 *   A · near-verbatim      phrases lifted from the paragraph. You are cast as
 *                          the expert but do not know the topic, so you have to
 *                          read. You will look somewhat like you are reading;
 *                          that trade is accepted deliberately.
 *   B · compressed concept the idea reduced to a few words. The transcript is
 *                          good and you want to say it, you just need the words
 *                          in the right order.
 *   C · loose keywords     hooks that may appear nowhere in the paragraph. You
 *                          know the topic cold and only need keeping on track.
 *
 * **One rule holds across every style**: the last trigger carries the approved
 * takeaway. Whatever is on screen, the last thing you see is the line you have
 * to land — and `test/domain.test.ts` holds every set to it.
 *
 * ⚠️ **Style C is deliberately identical across both corpora.** Loose keywords
 * are hooks that need not appear in the text at all, so re-cadencing the words
 * underneath does not change them. That is a real property of the experiment,
 * not an oversight: if C wins, the cadence rewrite did not matter; if A wins,
 * it mattered most. Do not vary C artificially to make the grid look symmetric.
 */
export const TRIGGER_SETS = {
  1: {
    'tom-original': {
      'near-verbatim': [
        ["So here's a question —", 1],
        ["you've got an AI assistant at work", 1],
        ['it can answer just about anything you ask it', 1],
        ['but can it actually go and do the job?', 1],
        ["That's the gap we keep running into.", 1],
        ['What Kybernesis builds is a full agent system', 2],
        ['agent is one of those words everyone uses differently', 2],
        ['just software that can take an action on your behalf', 2],
        ['not only answer a question', 2],
        ['the way we start is with one agent', 3],
        ["solving one problem that's genuinely worth solving", 3],
        ['underneath it we put a shared foundation', 3],
        ['memory, permissions, tools, coordination', 3],
        ['once that foundation is there', 3],
        ['the second agent and the third agent plug into it', 3],
        ['rather than starting over', 3],
        ['So you get to start small without thinking small.', 4],
      ],
      'loose-keywords': [
        ['THE GAP', 1],
        ['AGENT = TAKES ACTION', 2],
        ['ONE AGENT, SHARED FOUNDATION', 3],
        ['TWO AND THREE PLUG IN', 3],
        ['START SMALL WITHOUT THINKING SMALL.', 4],
      ],
    },
    'v01-rewrite': {
      'near-verbatim': [
        ["So here's a question.", 1],
        ["You've got an AI assistant at work", 1],
        ["it'll answer just about anything you ask it", 1],
        ['but can it actually go and do the job?', 1],
        ["That's the gap.", 1],
        ['What Kybernesis builds is a full agent system', 2],
        ['I want to gloss that word agent for a second', 2],
        ['because everyone uses it differently', 2],
        ['software that can take an action on your behalf', 2],
        ['and not only answer a question', 2],
        ['the way we start is with one agent', 3],
        ["solving one problem that's genuinely worth solving", 3],
        ['and then underneath it we put a shared foundation', 3],
        ['your memory and your permissions and your tools', 3],
        ['once the foundation is there', 3],
        ['the second agent and the third agent just plug into it', 3],
        ['instead of starting over', 3],
        ['So you get to start small without thinking small.', 4],
      ],
      'compressed-concept': [
        ["YOU'VE GOT AN ASSISTANT — CAN IT DO THE JOB?", 1],
        ['Answers anything you ask', 1],
        ["Can't go and do it", 1],
        ['An agent acts, not just answers', 2],
        ['Everyone uses the word differently', 2],
        ['Start with one agent worth having', 3],
        ['Underneath: memory, permissions, tools, coordination', 3],
        ['Two and three plug in, not start over', 3],
        ['START SMALL WITHOUT THINKING SMALL.', 4],
      ],
      'loose-keywords': [
        ['THE GAP', 1],
        ['AGENT = TAKES ACTION', 2],
        ['ONE AGENT, SHARED FOUNDATION', 3],
        ['TWO AND THREE PLUG IN', 3],
        ['START SMALL WITHOUT THINKING SMALL.', 4],
      ],
    },
  },
};
