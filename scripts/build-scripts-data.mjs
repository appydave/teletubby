/**
 * Generates `src/shared/scripts.ts` — the twelve Kybernesis Phase 1 scripts as
 * prompter data.
 *
 * WHY THIS EXISTS
 * The paragraphs (column 3) are lifted VERBATIM from Tom Lane's Phase 1 handover
 * via `src/shared/data/kybernesis-phase-1.source.json`, so they are never retyped
 * and never drift. The headings (column 1), the bullets (column 2) and the
 * bullet→paragraph map are AUTHORED — they live in this file, by hand.
 *
 * That split is deliberate. `docs/prior-art-kybernesis-prompter.md` §5 is explicit:
 * the map is authored data that ships alongside the triggers and is never derived
 * positionally. Deriving it proportionally was considered and rejected — the
 * boundaries do not fall evenly, and a wrong sync is worse than no sync.
 *
 * TWO ARTIFACTS, ONE AUTHORING SOURCE
 * This emits both `src/shared/script-set.ts` (the domain model — the source of
 * truth from session 1 onward) and `src/shared/scripts.ts` (the flat shape the
 * proof-of-concept renderer still reads). The second is a PROJECTION of the
 * same authored tables, not a second source; it is scheduled for removal when
 * the renderer moves onto the zone model in session 2.
 *
 * Run: `npm run build:data`
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { CADENCE, MAJORS, SET, TALENTS } from './authored-domain.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');

const source = JSON.parse(
  readFileSync(join(repo, 'src/shared/data/kybernesis-phase-1.source.json'), 'utf8'),
);

/**
 * Authored per script, keyed by script number.
 *
 * - `headings` — one per paragraph. Column 1. Length MUST equal paragraph count.
 * - `bullets`  — hook line, 4–6 points, landing line. Column 2. The landing line is
 *                held verbatim from Tom's approved "Desired takeaway".
 * - `map`      — one entry per bullet, a 1-based paragraph index. Must be
 *                monotonically non-decreasing, start at 1, and end at the last
 *                paragraph. Validated below; the build fails loudly if it isn't.
 */
const AUTHORED = {
  1: {
    headings: ['The gap', 'What an agent is', 'The shared foundation', 'Start small'],
    bullets: [
      "YOU'VE GOT AN ASSISTANT — CAN IT DO THE JOB?",
      'Answers anything you ask it',
      "But can't go and do the work",
      'An agent acts — not only answers',
      'Start with one agent worth having',
      'Underneath: memory, permissions, tools, coordination',
      'Agent two and three plug in, not start over',
      'WE CAN START SMALL WITHOUT THINKING SMALL.',
    ],
    map: [1, 1, 1, 2, 3, 3, 3, 4],
  },
  2: {
    headings: ['The familiar story', 'Why it stalls', 'Starting again', 'Build it differently'],
    bullets: [
      'THE PILOT WENT WELL. NOW NOBODY USES IT.',
      'Not a technology failure',
      'It was built as a demo',
      'No durable memory',
      'No real permissions model',
      'No path to a second use case',
      'So the next ask starts from scratch',
      'Earn its keep — on foundations you can build on',
      'THE ARCHITECTURE OF THE FIRST AGENT DECIDES WHETHER THE NEXT IS AN EXTENSION OR A RESTART.',
    ],
    map: [1, 2, 2, 2, 2, 2, 3, 4, 4],
  },
  3: {
    headings: ['The misunderstanding', 'Both ways it breaks', 'What governed means', 'The point'],
    bullets: [
      '"THE AGENT REMEMBERS" IS HEARD AS "IT KEEPS EVERYTHING".',
      "That's not what we want",
      'No memory: re-explain the business every time',
      "Unrestricted memory: holds what it shouldn't",
      "Or surfaces it to someone who shouldn't see it",
      "Governed = rules: what's stored, who uses it, how it's organised",
      'Continuity for the agent, control for you',
      'USEFUL MEMORY IS NOT JUST PERSISTENT. IT IS STRUCTURED AND CONTROLLED.',
    ],
    map: [1, 1, 2, 2, 2, 3, 3, 4],
  },
  4: {
    headings: ['What Arcana is', "What a model can't do", 'Structured, not a pile', 'The payoff'],
    bullets: [
      'ARCANA IS THE MEMORY LAYER UNDER THE AGENTS.',
      "A model answers from what's in front of it",
      "It doesn't remember your organisation",
      "Not last quarter's decision, not which client",
      'Structured is the important word',
      "Not one big pile — that isn't retrievable",
      'Right agent, right context, only what it may see',
      'ARCANA HELPS AN AGENT REMEMBER THE RIGHT THINGS IN A USEFUL, GOVERNED FORM.',
    ],
    map: [1, 2, 2, 2, 3, 3, 3, 4],
  },
  5: {
    headings: [
      'A fair question',
      'One assistant is useful',
      'Where it goes wrong',
      'Split the work up',
      'The reframe',
    ],
    bullets: [
      "WE'VE ALREADY GOT AN ASSISTANT — AREN'T WE DONE?",
      'Fair question',
      'One assistant answers broadly — genuinely useful',
      'Ask it to do everything and context overloads',
      'Responsibility gets fuzzy — which part was wrong?',
      'Access creeps — to do everything it must see everything',
      'A system splits it: specific jobs, scoped permissions, controlled handoffs',
      "YOU DON'T NEED ONE AI THAT SEES EVERYTHING. YOU NEED THE RIGHT AGENTS DOING THE RIGHT JOBS.",
    ],
    map: [1, 1, 2, 3, 3, 3, 4, 5],
  },
  6: {
    headings: [
      'Which one do I ask?',
      'What an orchestrator is',
      'One conversation on top',
      'The payoff',
    ],
    bullets: [
      "WHICH AGENT DO I ASK? — YOU SHOULDN'T HAVE TO KNOW.",
      'An orchestrator coordinates instead of doing the work',
      'Request comes in, it works out where it belongs',
      'Sends it to the right specialists',
      'Reassembles the permitted results into one answer',
      'Outside: one conversation. Underneath: three or four agents',
      'Each inside its own remit and its own permissions',
      'ONE COHERENT INTERACTION — WITHOUT MAKING EVERY AGENT AN ALL-ACCESS GENERALIST.',
    ],
    map: [1, 2, 2, 2, 2, 3, 3, 4],
  },
  7: {
    headings: [
      'One agent sounds simpler',
      'What actually happens',
      'Hard to govern',
      'Narrow it down',
      'Why it matters',
    ],
    bullets: [
      "ONE AGENT SOUNDS SIMPLER. IN PRACTICE IT ISN'T.",
      'Sales + finance + support + operations at once',
      "Context fills with what's irrelevant to the question",
      'Vaguer and less predictable — too much at once',
      'And to do all of it, it needs access to all of it',
      'Narrow each agent to one domain',
      'Clean context, predictable behaviour, simple permissions',
      'SPECIALISATION MAKES THE SYSTEM POSSIBLE TO UNDERSTAND, CONTROL AND IMPROVE.',
    ],
    map: [1, 2, 2, 2, 3, 4, 4, 5],
  },
  // Script 08's bullet set is quoted verbatim in docs/prior-art-kybernesis-prompter.md §4.
  // It is reproduced here exactly — it is the one surviving specimen of the original
  // prompter's authored triggers, and the reference point for the Q1 experiment.
  8: {
    headings: [
      'A concrete one',
      'The discount question',
      'How it actually works',
      'What sales never sees',
      'The pattern',
    ],
    bullets: [
      'YOUR SALES AGENT NEEDS TO KNOW IF IT CAN OFFER A DISCOUNT.',
      "That's genuinely a finance question",
      "But you don't want sales reading the finance data",
      'So the sales agent asks the finance agent',
      "Finance looks at what it's allowed to see",
      'Returns the answer only — approved, or not approved',
      'Sales never receives the underlying numbers. At any point.',
      'COLLABORATION DOES NOT REQUIRE UNIVERSAL ACCESS.',
    ],
    map: [1, 2, 2, 3, 3, 3, 4, 5],
  },
  9: {
    headings: [
      'A management problem',
      'The six things',
      'The alternative',
      'One question, one place',
      'The point',
    ],
    bullets: [
      'MORE THAN ONE AGENT MEANS A MANAGEMENT PROBLEM.',
      'A control plane governs the whole set',
      'Who each agent is · what it may access',
      'Which tools · what it may remember',
      'How work is routed · how you oversee it',
      'Otherwise: one-off rules scattered through workflows',
      'Fine for one agent. Breaks around the third',
      'Nowhere to check, change or audit anything',
      'One place to answer: what can this do, and who said so',
      'ENTERPRISE AI NEEDS A SYSTEM OF CONTROL, NOT JUST A COLLECTION OF PROMPTS.',
    ],
    map: [1, 2, 2, 2, 2, 3, 3, 3, 4, 5],
  },
  10: {
    headings: [
      'It works, nobody uses it',
      'The fix',
      'Where the work happens',
      'Same in Teams',
      'The payoff',
    ],
    bullets: [
      'THE AGENT WORKS FINE — AND STILL NOBODY USES IT.',
      'The reason is friction',
      'Another tab, another login, another habit',
      'Put the agent where the work already happens',
      "Ask in Slack, in the channel you're already in",
      'The answer comes back right there',
      'Behind it nothing changed — same memory, permissions, routing',
      'Exactly the same story in Teams',
      'THE AGENT FITS THE WAY THE TEAM ALREADY WORKS.',
    ],
    map: [1, 1, 1, 2, 3, 3, 3, 4, 5],
  },
  11: {
    headings: [
      'How the morning starts',
      'Overnight, each agent',
      'One short briefing',
      'Start on decisions',
    ],
    bullets: [
      "A MANAGER'S MORNING: THREE PEOPLE, FOUR SYSTEMS, NO PICTURE YET.",
      "Building the picture before you know where you're needed",
      'Instead: overnight each specialist watches its own patch',
      'Operations · the numbers · support',
      'Each flags anything that looks like an exception',
      'The orchestrator pulls it into one short briefing',
      'Not a data dump — the summary and the red flags',
      'START ON THE DECISIONS, NOT AN HOUR OF INFORMATION GATHERING.',
    ],
    map: [1, 1, 2, 2, 2, 3, 3, 4],
  },
  12: {
    headings: [
      'How should you start?',
      'Two ways to get it wrong',
      "What we'd recommend",
      'First proves itself',
      'The close',
    ],
    bullets: [
      'SO HOW SHOULD YOU ACTUALLY START?',
      'Too broad: months of programme before any value',
      'Too isolated: a tool that works and goes nowhere',
      'Neither — pick one use case that genuinely matters',
      'Something where everyone agrees the value is real',
      'Build it on memory, permissions, tools, orchestration',
      'The things a bigger system was going to need anyway',
      'Then two and three are additions, not rebuilds',
      'PROVE VALUE WITH ONE AGENT. BUILD THE PATH TO THE FULL SYSTEM FROM DAY ONE.',
    ],
    map: [1, 2, 2, 3, 3, 3, 3, 4, 5],
  },
};

/** Build-time validation. Every one of these caught a real authoring error. */
function validate(n, paragraphs, authored) {
  const { headings, bullets, map } = authored;
  const fail = (msg) => {
    throw new Error(`script ${String(n).padStart(2, '0')}: ${msg}`);
  };

  if (headings.length !== paragraphs.length)
    fail(`${headings.length} headings for ${paragraphs.length} paragraphs — must match`);
  if (map.length !== bullets.length)
    fail(`map has ${map.length} entries for ${bullets.length} bullets — must match`);
  if (bullets.length < 6) fail(`only ${bullets.length} bullets — expected hook + 4–6 + landing`);
  if (map[0] !== 1) fail(`map starts at paragraph ${map[0]} — must start at 1`);
  if (map[map.length - 1] !== paragraphs.length)
    fail(`map ends at paragraph ${map[map.length - 1]} — must end at ${paragraphs.length}`);
  for (let i = 1; i < map.length; i++) {
    if (map[i] < map[i - 1]) fail(`map goes backwards at step ${i + 1} — must be non-decreasing`);
  }
  for (const p of map) {
    if (p < 1 || p > paragraphs.length) fail(`map points at paragraph ${p}, out of range`);
  }
}

const scripts = source.map((v) => {
  const authored = AUTHORED[v.n];
  if (!authored) throw new Error(`no authored bullets for script ${v.n}`);
  validate(v.n, v.voice, authored);

  const takeaway = (v.tom.find((pair) => pair[0] === 'Desired takeaway') || [])[1] || '';

  return {
    n: v.n,
    title: v.t,
    takeaway: takeaway.replace(/[“”]/g, '').trim(),
    sections: v.voice.map((paragraph, i) => ({
      heading: authored.headings[i],
      paragraph,
    })),
    bullets: authored.bullets,
    map: authored.map,
  };
});

const banner = `/**
 * THE TWELVE KYBERNESIS PHASE 1 SCRIPTS — generated, do not edit by hand.
 *
 * Regenerate with \`npm run build:data\`. Paragraphs come verbatim from
 * src/shared/data/kybernesis-phase-1.source.json (Tom Lane's Phase 1 handover).
 * Headings, bullets and the bullet→paragraph map are authored in
 * scripts/build-scripts-data.mjs.
 */

export interface Section {
  /** Column 1 — the topic heading for this spoken beat. */
  heading: string;
  /** Column 3 — the transcript paragraph, verbatim. */
  paragraph: string;
}

export interface PrompterScript {
  n: number;
  title: string;
  /** Tom's approved "Desired takeaway" — the landing line is held to this. */
  takeaway: string;
  sections: Section[];
  /** Column 2 — hook line, 4–6 trigger points, landing line. */
  bullets: string[];
  /**
   * bullets[i] belongs to sections[map[i] - 1]. Authored, never derived —
   * see docs/prior-art-kybernesis-prompter.md §5.
   */
  map: number[];
}

export const SCRIPTS: PrompterScript[] = `;

const out = `${banner}${JSON.stringify(scripts, null, 2)};\n`;
writeFileSync(join(repo, 'src/shared/scripts.ts'), out);

/* ================================================================== *
 * THE DOMAIN MODEL — src/shared/script-set.ts
 * ================================================================== */

/** Group a flat list of minor headings under the authored major topics. */
function buildTopics(n, majors, minorHeadings, paragraphs, label) {
  const total = majors.reduce((sum, [, count]) => sum + count, 0);
  if (total !== minorHeadings.length)
    throw new Error(
      `${label}: majors cover ${total} minor topics but ${minorHeadings.length} headings exist`,
    );
  if (minorHeadings.length !== paragraphs.length)
    throw new Error(
      `${label}: ${minorHeadings.length} headings for ${paragraphs.length} paragraphs — must match`,
    );

  const topics = [];
  let cursor = 0;
  majors.forEach(([heading, count], m) => {
    const minors = [];
    for (let k = 0; k < count; k++) {
      const index = cursor + k;
      minors.push({
        id: `t${m + 1}.${k + 1}`,
        heading: minorHeadings[index],
        // One paragraph per minor topic in the Kybernesis corpus. The schema
        // allows several; nothing here needs it yet.
        paragraphs: [{ id: `p${index + 1}`, text: paragraphs[index] }],
      });
    }
    topics.push({ id: `t${m + 1}`, heading, minors });
    cursor += count;
  });
  return topics;
}

/**
 * The authored bullets are ONE trigger style, and it is style B — phrases
 * compressed out of the paragraph, not lifted verbatim (A) and not loose
 * keywords (C). Labelling it honestly matters: A and C are deliberately absent
 * because nothing has authored them yet, and the app never invents a trigger.
 * They arrive through `write_trigger_set`.
 */
function buildTriggerSet(authored, paragraphIds) {
  return {
    style: 'compressed-concept',
    authoredBy: 'hand',
    note: 'Carried over from the original Kybernesis prompter; the one surviving specimen. Not a settled rule — see docs/open-questions.md Q1.',
    triggers: authored.bullets.map((text, index) => ({
      id: `g${index + 1}`,
      text,
      paragraphId: paragraphIds[authored.map[index] - 1],
    })),
  };
}

const domainScripts = source.map((v) => {
  const authored = AUTHORED[v.n];
  const majors = MAJORS[v.n];
  if (!majors) throw new Error(`no authored major topics for script ${v.n}`);

  const label = `script ${String(v.n).padStart(2, '0')}`;
  const topics = buildTopics(v.n, majors, authored.headings, v.voice, label);
  const paragraphIds = topics.flatMap((major) =>
    major.minors.flatMap((minor) => minor.paragraphs.map((p) => p.id)),
  );

  const takeaway = (v.tom.find((pair) => pair[0] === 'Desired takeaway') || [])[1] || '';
  // `one` is Tom's one-liner — brief by construction, which is what
  // requirements §6 asks for ("a set of twelve scannable in one sitting").
  // `desc` is the long production note and is deliberately NOT used here.
  const summary = (v.one || (Array.isArray(v.desc) ? v.desc[0] : v.desc) || v.t || '')
    .toString()
    .trim();

  const transcripts = [
    {
      id: 'tom-original',
      kind: 'provenance',
      corpus: 'tom-original',
      talentId: null,
      source: 'src/shared/data/kybernesis-phase-1.source.json — Tom Lane’s Phase 1 handover',
      topics,
      triggerSets: [buildTriggerSet(authored, paragraphIds)],
    },
  ];

  const cadence = CADENCE[v.n];
  if (cadence) {
    const cadenceTopics = buildTopics(
      v.n,
      cadence.majors,
      cadence.minors,
      cadence.paragraphs,
      `${label} (${cadence.corpus})`,
    );
    transcripts.push({
      id: cadence.corpus,
      kind: 'cadence',
      corpus: cadence.corpus,
      // A cadence transcript without a talent is meaningless — cadence is
      // measured per person, never in general.
      talentId: 'david',
      source: cadence.source,
      topics: cadenceTopics,
      // No trigger set. Triggers derived from Tom's 7-word breath groups are a
      // DIFFERENT experiment from triggers derived from the 11-word rewrite
      // (requirements open item 9). Authoring them is an agent's job, and
      // inventing them here would silently settle the question.
      triggerSets: [],
    });
  }

  return {
    id: `${SET.id}/${String(v.n).padStart(2, '0')}`,
    n: v.n,
    title: v.t,
    takeaway: takeaway.replace(/[“”]/g, '').trim(),
    summary,
    transcripts,
  };
});

const scriptSet = { ...SET, scripts: domainScripts };

const domainBanner = `/**
 * THE KYBERNESIS PHASE 1 SET — generated, do not edit by hand.
 *
 * Regenerate with \`npm run build:data\`. This is the SEED for the repository,
 * not the live copy: the control API writes to disk, and seeding never
 * overwrites what is already there (src/core/repository.ts).
 *
 * Shapes come from src/shared/domain.ts. Paragraphs are verbatim — Tom's
 * originals from src/shared/data/kybernesis-phase-1.source.json, the
 * re-cadenced versions from ~/dev/ad/brains/kybernesis/phase-1-scripts/.
 * Headings, major-topic groupings and the one trigger set are authored by hand
 * in scripts/authored-domain.mjs and scripts/build-scripts-data.mjs.
 */

import type { ScriptSet, Talent } from './domain.js';

export const KYBERNESIS_PHASE_1: ScriptSet = `;

writeFileSync(
  join(repo, 'src/shared/script-set.ts'),
  `${domainBanner}${JSON.stringify(scriptSet, null, 2)};\n\nexport const TALENTS: Talent[] = ${JSON.stringify(
    TALENTS,
    null,
    2,
  )};\n`,
);

const cadenceCount = domainScripts.filter((s) =>
  s.transcripts.some((t) => t.kind === 'cadence'),
).length;
console.log(
  `✓ wrote src/shared/script-set.ts — ${domainScripts.length} scripts, ${cadenceCount} with a cadence transcript, ${TALENTS.length} talent(s)`,
);

console.log(`✓ wrote src/shared/scripts.ts — ${scripts.length} scripts`);
for (const s of scripts) {
  console.log(
    `  ${String(s.n).padStart(2, '0')}  ${s.sections.length} sections · ${s.bullets.length} bullets · ${s.title}`,
  );
}
