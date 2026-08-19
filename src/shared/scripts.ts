/**
 * THE TWELVE KYBERNESIS PHASE 1 SCRIPTS — generated, do not edit by hand.
 *
 * Regenerate with `npm run build:data`. Paragraphs come verbatim from
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

export const SCRIPTS: PrompterScript[] = [
  {
    "n": 1,
    "title": "What Kybernesis actually builds",
    "takeaway": "We can start small without thinking small.",
    "sections": [
      {
        "heading": "The gap",
        "paragraph": "So here's a question — you've got an AI assistant at work, and it can answer just about anything you ask it, but can it actually go and do the job? That's the gap we keep running into."
      },
      {
        "heading": "What an agent is",
        "paragraph": "What Kybernesis builds is a full agent system. And I'll gloss that, because agent is one of those words everyone uses differently — an agent is just software that can take an action on your behalf, not only answer a question."
      },
      {
        "heading": "The shared foundation",
        "paragraph": "Now the way we start is with one agent, solving one problem that's genuinely worth solving. But underneath it we put a shared foundation — memory, permissions, tools, coordination. And that's the bit that actually matters, because once that foundation is there, the second agent and the third agent plug into it rather than starting over."
      },
      {
        "heading": "Start small",
        "paragraph": "So you get to start small without thinking small. That's really the whole idea."
      }
    ],
    "bullets": [
      "YOU'VE GOT AN ASSISTANT — CAN IT DO THE JOB?",
      "Answers anything you ask it",
      "But can't go and do the work",
      "An agent acts — not only answers",
      "Start with one agent worth having",
      "Underneath: memory, permissions, tools, coordination",
      "Agent two and three plug in, not start over",
      "WE CAN START SMALL WITHOUT THINKING SMALL."
    ],
    "map": [
      1,
      1,
      1,
      2,
      3,
      3,
      3,
      4
    ]
  },
  {
    "n": 2,
    "title": "Why AI pilots become dead ends",
    "takeaway": "The architecture of the first agent determines whether the next one is an extension or a restart.",
    "sections": [
      {
        "heading": "The familiar story",
        "paragraph": "Do you ever get that thing where the AI pilot went really well, everyone was impressed, and then six months later nobody's using it?"
      },
      {
        "heading": "Why it stalls",
        "paragraph": "That happens a lot, and it's usually not because the technology failed. It's because the pilot was built as a demo. Now a demo is fine — but a demo has no durable memory, it's got no real permissions model, and there's no path to add a second use case."
      },
      {
        "heading": "Starting again",
        "paragraph": "So when someone asks for the next thing, you're not extending anything. You're starting again."
      },
      {
        "heading": "Build it differently",
        "paragraph": "What we'd do differently is build that first use case so it earns its keep straight away, but sits on foundations you can actually build on. Same first project, very different second project. The architecture of the first agent is what decides whether the next one is an extension or a restart."
      }
    ],
    "bullets": [
      "THE PILOT WENT WELL. NOW NOBODY USES IT.",
      "Not a technology failure",
      "It was built as a demo",
      "No durable memory",
      "No real permissions model",
      "No path to a second use case",
      "So the next ask starts from scratch",
      "Earn its keep — on foundations you can build on",
      "THE ARCHITECTURE OF THE FIRST AGENT DECIDES WHETHER THE NEXT IS AN EXTENSION OR A RESTART."
    ],
    "map": [
      1,
      2,
      2,
      2,
      2,
      2,
      3,
      4,
      4
    ]
  },
  {
    "n": 3,
    "title": "Why agents need governed memory",
    "takeaway": "Useful memory is not just persistent. It is structured and controlled.",
    "sections": [
      {
        "heading": "The misunderstanding",
        "paragraph": "Let's talk about memory, because I think it's the most misunderstood bit of all of this. When people hear the agent remembers, they often hear the agent keeps everything — and that's not what we want at all."
      },
      {
        "heading": "Both ways it breaks",
        "paragraph": "Here's the problem. Without memory, your agent forgets the context every single time, so you're re-explaining your business on every interaction. But with unrestricted memory, it might hold on to things it shouldn't, or surface them to someone who shouldn't see them."
      },
      {
        "heading": "What governed means",
        "paragraph": "So governed memory is the middle path. And governed just means there are rules — what gets stored, who's allowed to use it, and how it's organised. The agent gets continuity, and you keep control of what it's actually retaining."
      },
      {
        "heading": "The point",
        "paragraph": "Useful memory isn't just memory that persists. It's memory that's structured and controlled."
      }
    ],
    "bullets": [
      "\"THE AGENT REMEMBERS\" IS HEARD AS \"IT KEEPS EVERYTHING\".",
      "That's not what we want",
      "No memory: re-explain the business every time",
      "Unrestricted memory: holds what it shouldn't",
      "Or surfaces it to someone who shouldn't see it",
      "Governed = rules: what's stored, who uses it, how it's organised",
      "Continuity for the agent, control for you",
      "USEFUL MEMORY IS NOT JUST PERSISTENT. IT IS STRUCTURED AND CONTROLLED."
    ],
    "map": [
      1,
      1,
      2,
      2,
      2,
      3,
      3,
      4
    ]
  },
  {
    "n": 4,
    "title": "What Arcana does",
    "takeaway": "Arcana helps an agent remember the right things in a useful, governed form.",
    "sections": [
      {
        "heading": "What Arcana is",
        "paragraph": "So what is Arcana? Arcana is the memory layer that sits underneath the agents."
      },
      {
        "heading": "What a model can't do",
        "paragraph": "Here's the thing a model on its own does really well — it can answer from whatever's in front of it right now. What it can't do is remember your organisation. It doesn't know what was decided last quarter, or which client this relates to, or what your team already tried and ruled out."
      },
      {
        "heading": "Structured, not a pile",
        "paragraph": "Arcana is where that lives. And the important word is structured, because it's not one big pile of every document and conversation you've ever had — that's not actually retrievable when you need it. It organises the knowledge so the right agent can pull the right context at the moment it needs it, and only within what it's permitted to see."
      },
      {
        "heading": "The payoff",
        "paragraph": "So the agent remembers the right things, in a form that's actually useful."
      }
    ],
    "bullets": [
      "ARCANA IS THE MEMORY LAYER UNDER THE AGENTS.",
      "A model answers from what's in front of it",
      "It doesn't remember your organisation",
      "Not last quarter's decision, not which client",
      "Structured is the important word",
      "Not one big pile — that isn't retrievable",
      "Right agent, right context, only what it may see",
      "ARCANA HELPS AN AGENT REMEMBER THE RIGHT THINGS IN A USEFUL, GOVERNED FORM."
    ],
    "map": [
      1,
      2,
      2,
      2,
      3,
      3,
      3,
      4
    ]
  },
  {
    "n": 5,
    "title": "Why one assistant isn't a system",
    "takeaway": "A company does not need one AI that can see everything. It needs the right agents doing the right jobs.",
    "sections": [
      {
        "heading": "A fair question",
        "paragraph": "Now you might be thinking, we've already got an AI assistant, so aren't we done? And it's a fair question."
      },
      {
        "heading": "One assistant is useful",
        "paragraph": "One assistant can answer very broadly, and that's genuinely useful — I use one every day. But if you ask that one assistant to know everything and do everything, a couple of things start to go wrong."
      },
      {
        "heading": "Where it goes wrong",
        "paragraph": "Its context gets overloaded, so it gets vaguer. Responsibility gets fuzzy — when something comes out wrong, which part was wrong? And access creeps, because to do everything, it needs to see everything."
      },
      {
        "heading": "Split the work up",
        "paragraph": "What a full agent system does instead is split the work up. Different agents, specific jobs, the context and the permissions each one actually needs, and controlled handoffs between them."
      },
      {
        "heading": "The reframe",
        "paragraph": "So it's not that you need one AI that can see everything. You need the right agents doing the right jobs."
      }
    ],
    "bullets": [
      "WE'VE ALREADY GOT AN ASSISTANT — AREN'T WE DONE?",
      "Fair question",
      "One assistant answers broadly — genuinely useful",
      "Ask it to do everything and context overloads",
      "Responsibility gets fuzzy — which part was wrong?",
      "Access creeps — to do everything it must see everything",
      "A system splits it: specific jobs, scoped permissions, controlled handoffs",
      "YOU DON'T NEED ONE AI THAT SEES EVERYTHING. YOU NEED THE RIGHT AGENTS DOING THE RIGHT JOBS."
    ],
    "map": [
      1,
      1,
      2,
      3,
      3,
      3,
      4,
      5
    ]
  },
  {
    "n": 6,
    "title": "What an orchestrator agent does",
    "takeaway": "The user gets one coherent interaction without turning every agent into an all-access generalist.",
    "sections": [
      {
        "heading": "Which one do I ask?",
        "paragraph": "So if you've got a handful of specialist agents, there's an obvious question — how does anyone know which one to ask? And the answer is, they shouldn't have to."
      },
      {
        "heading": "What an orchestrator is",
        "paragraph": "That's what an orchestrator does. An orchestrator is just an agent whose job is coordination rather than doing the work itself. A request comes in, it works out where that work actually belongs, it sends it off to the right specialists, and then it puts the permitted results back together into one answer."
      },
      {
        "heading": "One conversation on top",
        "paragraph": "So from the outside it looks like one conversation. Underneath, three or four agents each did their own piece, each staying inside its own responsibility and its own permissions."
      },
      {
        "heading": "The payoff",
        "paragraph": "The person asking gets one coherent interaction — and you haven't had to turn every agent into an all-access generalist to get it."
      }
    ],
    "bullets": [
      "WHICH AGENT DO I ASK? — YOU SHOULDN'T HAVE TO KNOW.",
      "An orchestrator coordinates instead of doing the work",
      "Request comes in, it works out where it belongs",
      "Sends it to the right specialists",
      "Reassembles the permitted results into one answer",
      "Outside: one conversation. Underneath: three or four agents",
      "Each inside its own remit and its own permissions",
      "ONE COHERENT INTERACTION — WITHOUT MAKING EVERY AGENT AN ALL-ACCESS GENERALIST."
    ],
    "map": [
      1,
      2,
      2,
      2,
      2,
      3,
      3,
      4
    ]
  },
  {
    "n": 7,
    "title": "Why specialist agents stay cleaner",
    "takeaway": "Specialisation makes an agent system easier to understand, control and improve.",
    "sections": [
      {
        "heading": "One agent sounds simpler",
        "paragraph": "Let's have a look at why we split agents up, because on the face of it, one agent sounds simpler."
      },
      {
        "heading": "What actually happens",
        "paragraph": "Here's what happens in practice. If you've got one agent carrying sales, and finance, and support, and operations all at the same time, its context fills up with things that aren't relevant to the question in front of it. And that makes it vaguer and less predictable — not because it's a bad model, just because you've handed it too much at once."
      },
      {
        "heading": "Hard to govern",
        "paragraph": "It's also very hard to govern, because to do all of that, it needs access to all of it."
      },
      {
        "heading": "Narrow it down",
        "paragraph": "Now if you narrow each agent down to one domain, the context stays clean, the behaviour gets more predictable, and permissions become a lot more straightforward."
      },
      {
        "heading": "Why it matters",
        "paragraph": "So specialisation isn't complexity for its own sake. It's what makes the system possible to understand, control and improve."
      }
    ],
    "bullets": [
      "ONE AGENT SOUNDS SIMPLER. IN PRACTICE IT ISN'T.",
      "Sales + finance + support + operations at once",
      "Context fills with what's irrelevant to the question",
      "Vaguer and less predictable — too much at once",
      "And to do all of it, it needs access to all of it",
      "Narrow each agent to one domain",
      "Clean context, predictable behaviour, simple permissions",
      "SPECIALISATION MAKES THE SYSTEM POSSIBLE TO UNDERSTAND, CONTROL AND IMPROVE."
    ],
    "map": [
      1,
      2,
      2,
      2,
      3,
      4,
      4,
      5
    ]
  },
  {
    "n": 8,
    "title": "Collaboration without exposing data",
    "takeaway": "Collaboration does not require universal access.",
    "sections": [
      {
        "heading": "A concrete one",
        "paragraph": "Here's a concrete one, because I think this is where it clicks."
      },
      {
        "heading": "The discount question",
        "paragraph": "Say your sales agent needs to know whether it can offer a particular discount. Now that's genuinely a finance question. But you really don't want your sales agent reading the finance data to answer it."
      },
      {
        "heading": "How it actually works",
        "paragraph": "So what happens instead is the sales agent asks the finance agent. The finance agent looks at the restricted data — which it is allowed to see — and it sends back the answer, and only the answer. Approved, or not approved."
      },
      {
        "heading": "What sales never sees",
        "paragraph": "The sales agent never receives the underlying numbers. It never had access to them at any point in that exchange."
      },
      {
        "heading": "The pattern",
        "paragraph": "And that's really the pattern for the whole system. Agents can work the same job together without every agent needing to see everything. Collaboration doesn't require universal access."
      }
    ],
    "bullets": [
      "YOUR SALES AGENT NEEDS TO KNOW IF IT CAN OFFER A DISCOUNT.",
      "That's genuinely a finance question",
      "But you don't want sales reading the finance data",
      "So the sales agent asks the finance agent",
      "Finance looks at what it's allowed to see",
      "Returns the answer only — approved, or not approved",
      "Sales never receives the underlying numbers. At any point.",
      "COLLABORATION DOES NOT REQUIRE UNIVERSAL ACCESS."
    ],
    "map": [
      1,
      2,
      2,
      3,
      3,
      3,
      4,
      5
    ]
  },
  {
    "n": 9,
    "title": "What a control plane governs",
    "takeaway": "Enterprise AI needs a system of control, not just a collection of prompts.",
    "sections": [
      {
        "heading": "A management problem",
        "paragraph": "So once you've got more than one agent running, you've got a management problem — and this is the part that tends to get skipped."
      },
      {
        "heading": "The six things",
        "paragraph": "A control plane is the layer that governs the whole set. And it covers six things: who each agent is, what it's allowed to access, which tools it can use, what it's permitted to remember, how work gets routed, and how you oversee what actually happened."
      },
      {
        "heading": "The alternative",
        "paragraph": "Now the alternative is that all of that lives as one-off rules scattered inside individual workflows. And that works fine for one agent. It stops working somewhere around the third, because there's no single place to check anything, change anything, or audit anything."
      },
      {
        "heading": "One question, one place",
        "paragraph": "So the control plane is really about being able to answer one question in one place — what can this thing do, and who said so."
      },
      {
        "heading": "The point",
        "paragraph": "Enterprise AI needs a system of control, not just a collection of prompts."
      }
    ],
    "bullets": [
      "MORE THAN ONE AGENT MEANS A MANAGEMENT PROBLEM.",
      "A control plane governs the whole set",
      "Who each agent is · what it may access",
      "Which tools · what it may remember",
      "How work is routed · how you oversee it",
      "Otherwise: one-off rules scattered through workflows",
      "Fine for one agent. Breaks around the third",
      "Nowhere to check, change or audit anything",
      "One place to answer: what can this do, and who said so",
      "ENTERPRISE AI NEEDS A SYSTEM OF CONTROL, NOT JUST A COLLECTION OF PROMPTS."
    ],
    "map": [
      1,
      2,
      2,
      2,
      2,
      3,
      3,
      3,
      4,
      5
    ]
  },
  {
    "n": 10,
    "title": "Why agents belong in Slack or Teams",
    "takeaway": "The agent can fit the way the team already works.",
    "sections": [
      {
        "heading": "It works, nobody uses it",
        "paragraph": "So here's something we see again and again — the agent works fine, and people still don't use it. And usually the reason is just friction. It's another tab, another login, another habit somebody has to build."
      },
      {
        "heading": "The fix",
        "paragraph": "Now the fix is pretty simple. Put the agent where the work already happens."
      },
      {
        "heading": "Where the work happens",
        "paragraph": "So someone asks for what they need in Slack, in the channel they're already sitting in, and the answer comes back to them right there. And behind that, nothing has changed — same memory, same permissions, same routing, same specialist agents doing the work. All that's different is the doorway."
      },
      {
        "heading": "Same in Teams",
        "paragraph": "And it's exactly the same story in Teams."
      },
      {
        "heading": "The payoff",
        "paragraph": "So the agent fits the way your team already works, instead of asking your team to work a new way just to reach it."
      }
    ],
    "bullets": [
      "THE AGENT WORKS FINE — AND STILL NOBODY USES IT.",
      "The reason is friction",
      "Another tab, another login, another habit",
      "Put the agent where the work already happens",
      "Ask in Slack, in the channel you're already in",
      "The answer comes back right there",
      "Behind it nothing changed — same memory, permissions, routing",
      "Exactly the same story in Teams",
      "THE AGENT FITS THE WAY THE TEAM ALREADY WORKS."
    ],
    "map": [
      1,
      1,
      1,
      2,
      3,
      3,
      3,
      4,
      5
    ]
  },
  {
    "n": 11,
    "title": "The manager's morning briefing",
    "takeaway": "The manager starts with the important decisions, not an hour of information gathering.",
    "sections": [
      {
        "heading": "How the morning starts",
        "paragraph": "Let's do a practical one. Think about how a manager's morning usually starts — pinging three people, opening four systems, and building a picture in your head before you even know where you're actually needed."
      },
      {
        "heading": "Overnight, each agent",
        "paragraph": "So what would we do instead? Overnight, each specialist agent looks at its own patch — whatever it's permitted to see. One's watching operations, one's watching the numbers, one's watching support. And each one flags anything that looks like an exception."
      },
      {
        "heading": "One short briefing",
        "paragraph": "Then the orchestrator pulls all of that together into one short briefing, and that's what's waiting for you when you sit down. Not a data dump — the summary, and the red flags."
      },
      {
        "heading": "Start on decisions",
        "paragraph": "So you start your day on the decisions, rather than spending the first hour working out which decisions there are."
      }
    ],
    "bullets": [
      "A MANAGER'S MORNING: THREE PEOPLE, FOUR SYSTEMS, NO PICTURE YET.",
      "Building the picture before you know where you're needed",
      "Instead: overnight each specialist watches its own patch",
      "Operations · the numbers · support",
      "Each flags anything that looks like an exception",
      "The orchestrator pulls it into one short briefing",
      "Not a data dump — the summary and the red flags",
      "START ON THE DECISIONS, NOT AN HOUR OF INFORMATION GATHERING."
    ],
    "map": [
      1,
      1,
      2,
      2,
      2,
      3,
      3,
      4
    ]
  },
  {
    "n": 12,
    "title": "Start with one, design for the system",
    "takeaway": "Prove value with one agent. Build the path to the full system from day one.",
    "sections": [
      {
        "heading": "How should you start?",
        "paragraph": "So, to recap the whole approach — how should you actually start?"
      },
      {
        "heading": "Two ways to get it wrong",
        "paragraph": "There are two ways to get this wrong. You can start too broadly, and end up with an expensive programme running for months before anybody's seen any value. Or you can start with an isolated little tool that works fine and goes absolutely nowhere."
      },
      {
        "heading": "What we'd recommend",
        "paragraph": "What we'd recommend is neither. Pick one use case that genuinely matters — something where you can point at the value and everyone agrees it's real. Build that. But build it on the memory, the permissions, the tools and the orchestration that a bigger system was going to need anyway."
      },
      {
        "heading": "First proves itself",
        "paragraph": "So the first agent proves itself on its own merits, and the second and third are additions rather than rebuilds."
      },
      {
        "heading": "The close",
        "paragraph": "Prove value with one agent, and build the path to the full system from day one."
      }
    ],
    "bullets": [
      "SO HOW SHOULD YOU ACTUALLY START?",
      "Too broad: months of programme before any value",
      "Too isolated: a tool that works and goes nowhere",
      "Neither — pick one use case that genuinely matters",
      "Something where everyone agrees the value is real",
      "Build it on memory, permissions, tools, orchestration",
      "The things a bigger system was going to need anyway",
      "Then two and three are additions, not rebuilds",
      "PROVE VALUE WITH ONE AGENT. BUILD THE PATH TO THE FULL SYSTEM FROM DAY ONE."
    ],
    "map": [
      1,
      2,
      2,
      3,
      3,
      3,
      3,
      4,
      5
    ]
  }
];
