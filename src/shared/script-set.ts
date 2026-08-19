/**
 * THE KYBERNESIS PHASE 1 SET — generated, do not edit by hand.
 *
 * Regenerate with `npm run build:data`. This is the SEED for the repository,
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

export const KYBERNESIS_PHASE_1: ScriptSet = {
  "id": "kybernesis-phase-1",
  "title": "Kybernesis — Phase 1",
  "description": "The twelve Phase 1 explainers handed over by Tom Lane. Provenance transcripts are his approved originals; scripts 1–3 also carry a re-cadenced transcript voiced for David.",
  "scripts": [
    {
      "id": "kybernesis-phase-1/01",
      "n": 1,
      "title": "What Kybernesis actually builds",
      "takeaway": "We can start small without thinking small.",
      "summary": "The introduction video — the one you'd send someone who has never heard the name.",
      "transcripts": [
        {
          "id": "tom-original",
          "kind": "provenance",
          "corpus": "tom-original",
          "talentId": null,
          "source": "src/shared/data/kybernesis-phase-1.source.json — Tom Lane’s Phase 1 handover",
          "topics": [
            {
              "id": "t1",
              "heading": "The gap",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "The gap",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "So here's a question — you've got an AI assistant at work, and it can answer just about anything you ask it, but can it actually go and do the job? That's the gap we keep running into."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "What we actually build",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "What an agent is",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "What Kybernesis builds is a full agent system. And I'll gloss that, because agent is one of those words everyone uses differently — an agent is just software that can take an action on your behalf, not only answer a question."
                    }
                  ]
                },
                {
                  "id": "t2.2",
                  "heading": "The shared foundation",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "Now the way we start is with one agent, solving one problem that's genuinely worth solving. But underneath it we put a shared foundation — memory, permissions, tools, coordination. And that's the bit that actually matters, because once that foundation is there, the second agent and the third agent plug into it rather than starting over."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "Start small",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "Start small",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "So you get to start small without thinking small. That's really the whole idea."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": [
            {
              "style": "compressed-concept",
              "authoredBy": "hand",
              "note": "Carried over from the original Kybernesis prompter; the one surviving specimen. Not a settled rule — see docs/open-questions.md Q1.",
              "triggers": [
                {
                  "id": "g1",
                  "text": "YOU'VE GOT AN ASSISTANT — CAN IT DO THE JOB?",
                  "paragraphId": "p1"
                },
                {
                  "id": "g2",
                  "text": "Answers anything you ask it",
                  "paragraphId": "p1"
                },
                {
                  "id": "g3",
                  "text": "But can't go and do the work",
                  "paragraphId": "p1"
                },
                {
                  "id": "g4",
                  "text": "An agent acts — not only answers",
                  "paragraphId": "p2"
                },
                {
                  "id": "g5",
                  "text": "Start with one agent worth having",
                  "paragraphId": "p3"
                },
                {
                  "id": "g6",
                  "text": "Underneath: memory, permissions, tools, coordination",
                  "paragraphId": "p3"
                },
                {
                  "id": "g7",
                  "text": "Agent two and three plug in, not start over",
                  "paragraphId": "p3"
                },
                {
                  "id": "g8",
                  "text": "WE CAN START SMALL WITHOUT THINKING SMALL.",
                  "paragraphId": "p4"
                }
              ]
            }
          ]
        },
        {
          "id": "v01-rewrite",
          "kind": "cadence",
          "corpus": "v01-rewrite",
          "talentId": "david",
          "source": "~/dev/ad/brains/kybernesis/phase-1-scripts/v01-rewrite.txt",
          "topics": [
            {
              "id": "t1",
              "heading": "The gap",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "The gap",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "So here's a question. You've got an AI assistant at work and it'll answer just about anything you ask it, but can it actually go and do the job? That's the gap."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "What we actually build",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "What an agent is",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "What Kybernesis builds is a full agent system, and I want to gloss that word agent for a second because everyone uses it differently, but an agent is really just software that can take an action on your behalf and not only answer a question."
                    }
                  ]
                },
                {
                  "id": "t2.2",
                  "heading": "The shared foundation",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "Now the way we start is with one agent solving one problem that's genuinely worth solving, and then underneath it we put a shared foundation, and that's your memory and your permissions and your tools and your coordination. And that's the part that matters, because once the foundation is there the second agent and the third agent just plug into it instead of starting over."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "Start small",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "Start small",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "So you get to start small without thinking small. That's the whole idea."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": []
        }
      ]
    },
    {
      "id": "kybernesis-phase-1/02",
      "n": 2,
      "title": "Why AI pilots become dead ends",
      "takeaway": "The architecture of the first agent determines whether the next one is an extension or a restart.",
      "summary": "The trust-builder — it names the bad experience the viewer has probably already had.",
      "transcripts": [
        {
          "id": "tom-original",
          "kind": "provenance",
          "corpus": "tom-original",
          "talentId": null,
          "source": "src/shared/data/kybernesis-phase-1.source.json — Tom Lane’s Phase 1 handover",
          "topics": [
            {
              "id": "t1",
              "heading": "The pilot that stalled",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "The familiar story",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "Do you ever get that thing where the AI pilot went really well, everyone was impressed, and then six months later nobody's using it?"
                    }
                  ]
                },
                {
                  "id": "t1.2",
                  "heading": "Why it stalls",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "That happens a lot, and it's usually not because the technology failed. It's because the pilot was built as a demo. Now a demo is fine — but a demo has no durable memory, it's got no real permissions model, and there's no path to add a second use case."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "Why the next ask restarts",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "Starting again",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "So when someone asks for the next thing, you're not extending anything. You're starting again."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "Build it differently",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "Build it differently",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "What we'd do differently is build that first use case so it earns its keep straight away, but sits on foundations you can actually build on. Same first project, very different second project. The architecture of the first agent is what decides whether the next one is an extension or a restart."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": [
            {
              "style": "compressed-concept",
              "authoredBy": "hand",
              "note": "Carried over from the original Kybernesis prompter; the one surviving specimen. Not a settled rule — see docs/open-questions.md Q1.",
              "triggers": [
                {
                  "id": "g1",
                  "text": "THE PILOT WENT WELL. NOW NOBODY USES IT.",
                  "paragraphId": "p1"
                },
                {
                  "id": "g2",
                  "text": "Not a technology failure",
                  "paragraphId": "p2"
                },
                {
                  "id": "g3",
                  "text": "It was built as a demo",
                  "paragraphId": "p2"
                },
                {
                  "id": "g4",
                  "text": "No durable memory",
                  "paragraphId": "p2"
                },
                {
                  "id": "g5",
                  "text": "No real permissions model",
                  "paragraphId": "p2"
                },
                {
                  "id": "g6",
                  "text": "No path to a second use case",
                  "paragraphId": "p2"
                },
                {
                  "id": "g7",
                  "text": "So the next ask starts from scratch",
                  "paragraphId": "p3"
                },
                {
                  "id": "g8",
                  "text": "Earn its keep — on foundations you can build on",
                  "paragraphId": "p4"
                },
                {
                  "id": "g9",
                  "text": "THE ARCHITECTURE OF THE FIRST AGENT DECIDES WHETHER THE NEXT IS AN EXTENSION OR A RESTART.",
                  "paragraphId": "p4"
                }
              ]
            }
          ]
        },
        {
          "id": "v02-rewrite",
          "kind": "cadence",
          "corpus": "v02-rewrite",
          "talentId": "david",
          "source": "~/dev/ad/brains/kybernesis/phase-1-scripts/v02-rewrite.txt",
          "topics": [
            {
              "id": "t1",
              "heading": "The pilot that stalled",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "The familiar story",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "Do you ever get that thing where the AI pilot went really well and everyone was impressed, and then six months later nobody's using it? That happens a lot."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "Why the next ask restarts",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "Why it stalls",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "It's usually not because the technology failed, it's because the pilot got built as a demo, and a demo is fine as far as it goes, but it's got no durable memory and no real permissions model and no path at all to add a second use case. So when somebody asks for the next thing you're not extending anything. You're starting again."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "Build it differently",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "Build it differently",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "What we'd do differently is build that first use case so it earns its keep straight away, but it sits on foundations you can actually build on afterwards. Same first project, very different second project. The architecture of the first agent is what decides whether the next one is an extension or a restart."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": []
        }
      ]
    },
    {
      "id": "kybernesis-phase-1/03",
      "n": 3,
      "title": "Why agents need governed memory",
      "takeaway": "Useful memory is not just persistent. It is structured and controlled.",
      "summary": "The data-governance video — aimed at whoever will ask “where does our information go?”",
      "transcripts": [
        {
          "id": "tom-original",
          "kind": "provenance",
          "corpus": "tom-original",
          "talentId": null,
          "source": "src/shared/data/kybernesis-phase-1.source.json — Tom Lane’s Phase 1 handover",
          "topics": [
            {
              "id": "t1",
              "heading": "What \"it remembers\" is heard as",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "The misunderstanding",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "Let's talk about memory, because I think it's the most misunderstood bit of all of this. When people hear the agent remembers, they often hear the agent keeps everything — and that's not what we want at all."
                    }
                  ]
                },
                {
                  "id": "t1.2",
                  "heading": "Both ways it breaks",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "Here's the problem. Without memory, your agent forgets the context every single time, so you're re-explaining your business on every interaction. But with unrestricted memory, it might hold on to things it shouldn't, or surface them to someone who shouldn't see them."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "What governed means",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "What governed means",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "So governed memory is the middle path. And governed just means there are rules — what gets stored, who's allowed to use it, and how it's organised. The agent gets continuity, and you keep control of what it's actually retaining."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "The point",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "The point",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "Useful memory isn't just memory that persists. It's memory that's structured and controlled."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": [
            {
              "style": "compressed-concept",
              "authoredBy": "hand",
              "note": "Carried over from the original Kybernesis prompter; the one surviving specimen. Not a settled rule — see docs/open-questions.md Q1.",
              "triggers": [
                {
                  "id": "g1",
                  "text": "\"THE AGENT REMEMBERS\" IS HEARD AS \"IT KEEPS EVERYTHING\".",
                  "paragraphId": "p1"
                },
                {
                  "id": "g2",
                  "text": "That's not what we want",
                  "paragraphId": "p1"
                },
                {
                  "id": "g3",
                  "text": "No memory: re-explain the business every time",
                  "paragraphId": "p2"
                },
                {
                  "id": "g4",
                  "text": "Unrestricted memory: holds what it shouldn't",
                  "paragraphId": "p2"
                },
                {
                  "id": "g5",
                  "text": "Or surfaces it to someone who shouldn't see it",
                  "paragraphId": "p2"
                },
                {
                  "id": "g6",
                  "text": "Governed = rules: what's stored, who uses it, how it's organised",
                  "paragraphId": "p3"
                },
                {
                  "id": "g7",
                  "text": "Continuity for the agent, control for you",
                  "paragraphId": "p3"
                },
                {
                  "id": "g8",
                  "text": "USEFUL MEMORY IS NOT JUST PERSISTENT. IT IS STRUCTURED AND CONTROLLED.",
                  "paragraphId": "p4"
                }
              ]
            }
          ]
        },
        {
          "id": "v03-rewrite",
          "kind": "cadence",
          "corpus": "v03-rewrite",
          "talentId": "david",
          "source": "~/dev/ad/brains/kybernesis/phase-1-scripts/v03-rewrite.txt",
          "topics": [
            {
              "id": "t1",
              "heading": "What \"it remembers\" is heard as",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "The misunderstanding",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "Let's talk about memory, because I reckon it's the most misunderstood part of all of this, and when people hear that the agent remembers what they usually hear is that the agent keeps everything. That's not what we want at all."
                    }
                  ]
                },
                {
                  "id": "t1.2",
                  "heading": "Both ways it breaks",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "Here's the problem. Without memory your agent forgets the context every single time so you end up re-explaining your business on every interaction, but with unrestricted memory it might hold on to things it shouldn't or surface them to somebody who was never meant to see them."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "What governed means",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "What governed means",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "So governed memory is the middle path, and governed just means there are rules about what gets stored and who's allowed to use it and how it's organised. The agent gets continuity and you keep control of what it's actually retaining."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "The point",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "The point",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "Useful memory isn't just memory that persists. It's memory that's structured and controlled."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": []
        }
      ]
    },
    {
      "id": "kybernesis-phase-1/04",
      "n": 4,
      "title": "What Arcana does",
      "takeaway": "Arcana helps an agent remember the right things in a useful, governed form.",
      "summary": "The named-product video — for the person who hears “Arcana” in a meeting and looks it up.",
      "transcripts": [
        {
          "id": "tom-original",
          "kind": "provenance",
          "corpus": "tom-original",
          "talentId": null,
          "source": "src/shared/data/kybernesis-phase-1.source.json — Tom Lane’s Phase 1 handover",
          "topics": [
            {
              "id": "t1",
              "heading": "What Arcana is",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "What Arcana is",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "So what is Arcana? Arcana is the memory layer that sits underneath the agents."
                    }
                  ]
                },
                {
                  "id": "t1.2",
                  "heading": "What a model can't do",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "Here's the thing a model on its own does really well — it can answer from whatever's in front of it right now. What it can't do is remember your organisation. It doesn't know what was decided last quarter, or which client this relates to, or what your team already tried and ruled out."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "Structured, not a pile",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "Structured, not a pile",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "Arcana is where that lives. And the important word is structured, because it's not one big pile of every document and conversation you've ever had — that's not actually retrievable when you need it. It organises the knowledge so the right agent can pull the right context at the moment it needs it, and only within what it's permitted to see."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "The payoff",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "The payoff",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "So the agent remembers the right things, in a form that's actually useful."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": [
            {
              "style": "compressed-concept",
              "authoredBy": "hand",
              "note": "Carried over from the original Kybernesis prompter; the one surviving specimen. Not a settled rule — see docs/open-questions.md Q1.",
              "triggers": [
                {
                  "id": "g1",
                  "text": "ARCANA IS THE MEMORY LAYER UNDER THE AGENTS.",
                  "paragraphId": "p1"
                },
                {
                  "id": "g2",
                  "text": "A model answers from what's in front of it",
                  "paragraphId": "p2"
                },
                {
                  "id": "g3",
                  "text": "It doesn't remember your organisation",
                  "paragraphId": "p2"
                },
                {
                  "id": "g4",
                  "text": "Not last quarter's decision, not which client",
                  "paragraphId": "p2"
                },
                {
                  "id": "g5",
                  "text": "Structured is the important word",
                  "paragraphId": "p3"
                },
                {
                  "id": "g6",
                  "text": "Not one big pile — that isn't retrievable",
                  "paragraphId": "p3"
                },
                {
                  "id": "g7",
                  "text": "Right agent, right context, only what it may see",
                  "paragraphId": "p3"
                },
                {
                  "id": "g8",
                  "text": "ARCANA HELPS AN AGENT REMEMBER THE RIGHT THINGS IN A USEFUL, GOVERNED FORM.",
                  "paragraphId": "p4"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "kybernesis-phase-1/05",
      "n": 5,
      "title": "Why one assistant isn't a system",
      "takeaway": "A company does not need one AI that can see everything. It needs the right agents doing the right jobs.",
      "summary": "The objection-handler — “we already have Copilot, why would we need you?”",
      "transcripts": [
        {
          "id": "tom-original",
          "kind": "provenance",
          "corpus": "tom-original",
          "talentId": null,
          "source": "src/shared/data/kybernesis-phase-1.source.json — Tom Lane’s Phase 1 handover",
          "topics": [
            {
              "id": "t1",
              "heading": "A fair question",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "A fair question",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "Now you might be thinking, we've already got an AI assistant, so aren't we done? And it's a fair question."
                    }
                  ]
                },
                {
                  "id": "t1.2",
                  "heading": "One assistant is useful",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "One assistant can answer very broadly, and that's genuinely useful — I use one every day. But if you ask that one assistant to know everything and do everything, a couple of things start to go wrong."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "Where one assistant breaks",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "Where it goes wrong",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "Its context gets overloaded, so it gets vaguer. Responsibility gets fuzzy — when something comes out wrong, which part was wrong? And access creeps, because to do everything, it needs to see everything."
                    }
                  ]
                },
                {
                  "id": "t2.2",
                  "heading": "Split the work up",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "What a full agent system does instead is split the work up. Different agents, specific jobs, the context and the permissions each one actually needs, and controlled handoffs between them."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "The reframe",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "The reframe",
                  "paragraphs": [
                    {
                      "id": "p5",
                      "text": "So it's not that you need one AI that can see everything. You need the right agents doing the right jobs."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": [
            {
              "style": "compressed-concept",
              "authoredBy": "hand",
              "note": "Carried over from the original Kybernesis prompter; the one surviving specimen. Not a settled rule — see docs/open-questions.md Q1.",
              "triggers": [
                {
                  "id": "g1",
                  "text": "WE'VE ALREADY GOT AN ASSISTANT — AREN'T WE DONE?",
                  "paragraphId": "p1"
                },
                {
                  "id": "g2",
                  "text": "Fair question",
                  "paragraphId": "p1"
                },
                {
                  "id": "g3",
                  "text": "One assistant answers broadly — genuinely useful",
                  "paragraphId": "p2"
                },
                {
                  "id": "g4",
                  "text": "Ask it to do everything and context overloads",
                  "paragraphId": "p3"
                },
                {
                  "id": "g5",
                  "text": "Responsibility gets fuzzy — which part was wrong?",
                  "paragraphId": "p3"
                },
                {
                  "id": "g6",
                  "text": "Access creeps — to do everything it must see everything",
                  "paragraphId": "p3"
                },
                {
                  "id": "g7",
                  "text": "A system splits it: specific jobs, scoped permissions, controlled handoffs",
                  "paragraphId": "p4"
                },
                {
                  "id": "g8",
                  "text": "YOU DON'T NEED ONE AI THAT SEES EVERYTHING. YOU NEED THE RIGHT AGENTS DOING THE RIGHT JOBS.",
                  "paragraphId": "p5"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "kybernesis-phase-1/06",
      "n": 6,
      "title": "What an orchestrator agent does",
      "takeaway": "The user gets one coherent interaction without turning every agent into an all-access generalist.",
      "summary": "The most abstract of the twelve — it leans hardest on its diagram.",
      "transcripts": [
        {
          "id": "tom-original",
          "kind": "provenance",
          "corpus": "tom-original",
          "talentId": null,
          "source": "src/shared/data/kybernesis-phase-1.source.json — Tom Lane’s Phase 1 handover",
          "topics": [
            {
              "id": "t1",
              "heading": "Which one do I ask?",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "Which one do I ask?",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "So if you've got a handful of specialist agents, there's an obvious question — how does anyone know which one to ask? And the answer is, they shouldn't have to."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "What an orchestrator does",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "What an orchestrator is",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "That's what an orchestrator does. An orchestrator is just an agent whose job is coordination rather than doing the work itself. A request comes in, it works out where that work actually belongs, it sends it off to the right specialists, and then it puts the permitted results back together into one answer."
                    }
                  ]
                },
                {
                  "id": "t2.2",
                  "heading": "One conversation on top",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "So from the outside it looks like one conversation. Underneath, three or four agents each did their own piece, each staying inside its own responsibility and its own permissions."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "The payoff",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "The payoff",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "The person asking gets one coherent interaction — and you haven't had to turn every agent into an all-access generalist to get it."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": [
            {
              "style": "compressed-concept",
              "authoredBy": "hand",
              "note": "Carried over from the original Kybernesis prompter; the one surviving specimen. Not a settled rule — see docs/open-questions.md Q1.",
              "triggers": [
                {
                  "id": "g1",
                  "text": "WHICH AGENT DO I ASK? — YOU SHOULDN'T HAVE TO KNOW.",
                  "paragraphId": "p1"
                },
                {
                  "id": "g2",
                  "text": "An orchestrator coordinates instead of doing the work",
                  "paragraphId": "p2"
                },
                {
                  "id": "g3",
                  "text": "Request comes in, it works out where it belongs",
                  "paragraphId": "p2"
                },
                {
                  "id": "g4",
                  "text": "Sends it to the right specialists",
                  "paragraphId": "p2"
                },
                {
                  "id": "g5",
                  "text": "Reassembles the permitted results into one answer",
                  "paragraphId": "p2"
                },
                {
                  "id": "g6",
                  "text": "Outside: one conversation. Underneath: three or four agents",
                  "paragraphId": "p3"
                },
                {
                  "id": "g7",
                  "text": "Each inside its own remit and its own permissions",
                  "paragraphId": "p3"
                },
                {
                  "id": "g8",
                  "text": "ONE COHERENT INTERACTION — WITHOUT MAKING EVERY AGENT AN ALL-ACCESS GENERALIST.",
                  "paragraphId": "p4"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "kybernesis-phase-1/07",
      "n": 7,
      "title": "Why specialist agents stay cleaner",
      "takeaway": "Specialisation makes an agent system easier to understand, control and improve.",
      "summary": "The engineering-lead video — the technical case for splitting agents up.",
      "transcripts": [
        {
          "id": "tom-original",
          "kind": "provenance",
          "corpus": "tom-original",
          "talentId": null,
          "source": "src/shared/data/kybernesis-phase-1.source.json — Tom Lane’s Phase 1 handover",
          "topics": [
            {
              "id": "t1",
              "heading": "One agent sounds simpler",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "One agent sounds simpler",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "Let's have a look at why we split agents up, because on the face of it, one agent sounds simpler."
                    }
                  ]
                },
                {
                  "id": "t1.2",
                  "heading": "What actually happens",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "Here's what happens in practice. If you've got one agent carrying sales, and finance, and support, and operations all at the same time, its context fills up with things that aren't relevant to the question in front of it. And that makes it vaguer and less predictable — not because it's a bad model, just because you've handed it too much at once."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "Why narrow beats broad",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "Hard to govern",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "It's also very hard to govern, because to do all of that, it needs access to all of it."
                    }
                  ]
                },
                {
                  "id": "t2.2",
                  "heading": "Narrow it down",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "Now if you narrow each agent down to one domain, the context stays clean, the behaviour gets more predictable, and permissions become a lot more straightforward."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "Why it matters",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "Why it matters",
                  "paragraphs": [
                    {
                      "id": "p5",
                      "text": "So specialisation isn't complexity for its own sake. It's what makes the system possible to understand, control and improve."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": [
            {
              "style": "compressed-concept",
              "authoredBy": "hand",
              "note": "Carried over from the original Kybernesis prompter; the one surviving specimen. Not a settled rule — see docs/open-questions.md Q1.",
              "triggers": [
                {
                  "id": "g1",
                  "text": "ONE AGENT SOUNDS SIMPLER. IN PRACTICE IT ISN'T.",
                  "paragraphId": "p1"
                },
                {
                  "id": "g2",
                  "text": "Sales + finance + support + operations at once",
                  "paragraphId": "p2"
                },
                {
                  "id": "g3",
                  "text": "Context fills with what's irrelevant to the question",
                  "paragraphId": "p2"
                },
                {
                  "id": "g4",
                  "text": "Vaguer and less predictable — too much at once",
                  "paragraphId": "p2"
                },
                {
                  "id": "g5",
                  "text": "And to do all of it, it needs access to all of it",
                  "paragraphId": "p3"
                },
                {
                  "id": "g6",
                  "text": "Narrow each agent to one domain",
                  "paragraphId": "p4"
                },
                {
                  "id": "g7",
                  "text": "Clean context, predictable behaviour, simple permissions",
                  "paragraphId": "p4"
                },
                {
                  "id": "g8",
                  "text": "SPECIALISATION MAKES THE SYSTEM POSSIBLE TO UNDERSTAND, CONTROL AND IMPROVE.",
                  "paragraphId": "p5"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "kybernesis-phase-1/08",
      "n": 8,
      "title": "Collaboration without exposing data",
      "takeaway": "Collaboration does not require universal access.",
      "summary": "The security objection — and the most concrete brief of the twelve.",
      "transcripts": [
        {
          "id": "tom-original",
          "kind": "provenance",
          "corpus": "tom-original",
          "talentId": null,
          "source": "src/shared/data/kybernesis-phase-1.source.json — Tom Lane’s Phase 1 handover",
          "topics": [
            {
              "id": "t1",
              "heading": "A concrete example",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "A concrete one",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "Here's a concrete one, because I think this is where it clicks."
                    }
                  ]
                },
                {
                  "id": "t1.2",
                  "heading": "The discount question",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "Say your sales agent needs to know whether it can offer a particular discount. Now that's genuinely a finance question. But you really don't want your sales agent reading the finance data to answer it."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "How it actually works",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "How it actually works",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "So what happens instead is the sales agent asks the finance agent. The finance agent looks at the restricted data — which it is allowed to see — and it sends back the answer, and only the answer. Approved, or not approved."
                    }
                  ]
                },
                {
                  "id": "t2.2",
                  "heading": "What sales never sees",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "The sales agent never receives the underlying numbers. It never had access to them at any point in that exchange."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "The pattern",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "The pattern",
                  "paragraphs": [
                    {
                      "id": "p5",
                      "text": "And that's really the pattern for the whole system. Agents can work the same job together without every agent needing to see everything. Collaboration doesn't require universal access."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": [
            {
              "style": "compressed-concept",
              "authoredBy": "hand",
              "note": "Carried over from the original Kybernesis prompter; the one surviving specimen. Not a settled rule — see docs/open-questions.md Q1.",
              "triggers": [
                {
                  "id": "g1",
                  "text": "YOUR SALES AGENT NEEDS TO KNOW IF IT CAN OFFER A DISCOUNT.",
                  "paragraphId": "p1"
                },
                {
                  "id": "g2",
                  "text": "That's genuinely a finance question",
                  "paragraphId": "p2"
                },
                {
                  "id": "g3",
                  "text": "But you don't want sales reading the finance data",
                  "paragraphId": "p2"
                },
                {
                  "id": "g4",
                  "text": "So the sales agent asks the finance agent",
                  "paragraphId": "p3"
                },
                {
                  "id": "g5",
                  "text": "Finance looks at what it's allowed to see",
                  "paragraphId": "p3"
                },
                {
                  "id": "g6",
                  "text": "Returns the answer only — approved, or not approved",
                  "paragraphId": "p3"
                },
                {
                  "id": "g7",
                  "text": "Sales never receives the underlying numbers. At any point.",
                  "paragraphId": "p4"
                },
                {
                  "id": "g8",
                  "text": "COLLABORATION DOES NOT REQUIRE UNIVERSAL ACCESS.",
                  "paragraphId": "p5"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "kybernesis-phase-1/09",
      "n": 9,
      "title": "What a control plane governs",
      "takeaway": "Enterprise AI needs a system of control, not just a collection of prompts.",
      "summary": "The IT and governance video — six things, one layer.",
      "transcripts": [
        {
          "id": "tom-original",
          "kind": "provenance",
          "corpus": "tom-original",
          "talentId": null,
          "source": "src/shared/data/kybernesis-phase-1.source.json — Tom Lane’s Phase 1 handover",
          "topics": [
            {
              "id": "t1",
              "heading": "The management problem",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "A management problem",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "So once you've got more than one agent running, you've got a management problem — and this is the part that tends to get skipped."
                    }
                  ]
                },
                {
                  "id": "t1.2",
                  "heading": "The six things",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "A control plane is the layer that governs the whole set. And it covers six things: who each agent is, what it's allowed to access, which tools it can use, what it's permitted to remember, how work gets routed, and how you oversee what actually happened."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "One question, one place",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "The alternative",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "Now the alternative is that all of that lives as one-off rules scattered inside individual workflows. And that works fine for one agent. It stops working somewhere around the third, because there's no single place to check anything, change anything, or audit anything."
                    }
                  ]
                },
                {
                  "id": "t2.2",
                  "heading": "One question, one place",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "So the control plane is really about being able to answer one question in one place — what can this thing do, and who said so."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "The point",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "The point",
                  "paragraphs": [
                    {
                      "id": "p5",
                      "text": "Enterprise AI needs a system of control, not just a collection of prompts."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": [
            {
              "style": "compressed-concept",
              "authoredBy": "hand",
              "note": "Carried over from the original Kybernesis prompter; the one surviving specimen. Not a settled rule — see docs/open-questions.md Q1.",
              "triggers": [
                {
                  "id": "g1",
                  "text": "MORE THAN ONE AGENT MEANS A MANAGEMENT PROBLEM.",
                  "paragraphId": "p1"
                },
                {
                  "id": "g2",
                  "text": "A control plane governs the whole set",
                  "paragraphId": "p2"
                },
                {
                  "id": "g3",
                  "text": "Who each agent is · what it may access",
                  "paragraphId": "p2"
                },
                {
                  "id": "g4",
                  "text": "Which tools · what it may remember",
                  "paragraphId": "p2"
                },
                {
                  "id": "g5",
                  "text": "How work is routed · how you oversee it",
                  "paragraphId": "p2"
                },
                {
                  "id": "g6",
                  "text": "Otherwise: one-off rules scattered through workflows",
                  "paragraphId": "p3"
                },
                {
                  "id": "g7",
                  "text": "Fine for one agent. Breaks around the third",
                  "paragraphId": "p3"
                },
                {
                  "id": "g8",
                  "text": "Nowhere to check, change or audit anything",
                  "paragraphId": "p3"
                },
                {
                  "id": "g9",
                  "text": "One place to answer: what can this do, and who said so",
                  "paragraphId": "p4"
                },
                {
                  "id": "g10",
                  "text": "ENTERPRISE AI NEEDS A SYSTEM OF CONTROL, NOT JUST A COLLECTION OF PROMPTS.",
                  "paragraphId": "p5"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "kybernesis-phase-1/10",
      "n": 10,
      "title": "Why agents belong in Slack or Teams",
      "takeaway": "The agent can fit the way the team already works.",
      "summary": "The adoption video — and the one that tests your variant workflow.",
      "transcripts": [
        {
          "id": "tom-original",
          "kind": "provenance",
          "corpus": "tom-original",
          "talentId": null,
          "source": "src/shared/data/kybernesis-phase-1.source.json — Tom Lane’s Phase 1 handover",
          "topics": [
            {
              "id": "t1",
              "heading": "It works, nobody uses it",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "It works, nobody uses it",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "So here's something we see again and again — the agent works fine, and people still don't use it. And usually the reason is just friction. It's another tab, another login, another habit somebody has to build."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "Meet them where the work happens",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "The fix",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "Now the fix is pretty simple. Put the agent where the work already happens."
                    }
                  ]
                },
                {
                  "id": "t2.2",
                  "heading": "Where the work happens",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "So someone asks for what they need in Slack, in the channel they're already sitting in, and the answer comes back to them right there. And behind that, nothing has changed — same memory, same permissions, same routing, same specialist agents doing the work. All that's different is the doorway."
                    }
                  ]
                },
                {
                  "id": "t2.3",
                  "heading": "Same in Teams",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "And it's exactly the same story in Teams."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "The payoff",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "The payoff",
                  "paragraphs": [
                    {
                      "id": "p5",
                      "text": "So the agent fits the way your team already works, instead of asking your team to work a new way just to reach it."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": [
            {
              "style": "compressed-concept",
              "authoredBy": "hand",
              "note": "Carried over from the original Kybernesis prompter; the one surviving specimen. Not a settled rule — see docs/open-questions.md Q1.",
              "triggers": [
                {
                  "id": "g1",
                  "text": "THE AGENT WORKS FINE — AND STILL NOBODY USES IT.",
                  "paragraphId": "p1"
                },
                {
                  "id": "g2",
                  "text": "The reason is friction",
                  "paragraphId": "p1"
                },
                {
                  "id": "g3",
                  "text": "Another tab, another login, another habit",
                  "paragraphId": "p1"
                },
                {
                  "id": "g4",
                  "text": "Put the agent where the work already happens",
                  "paragraphId": "p2"
                },
                {
                  "id": "g5",
                  "text": "Ask in Slack, in the channel you're already in",
                  "paragraphId": "p3"
                },
                {
                  "id": "g6",
                  "text": "The answer comes back right there",
                  "paragraphId": "p3"
                },
                {
                  "id": "g7",
                  "text": "Behind it nothing changed — same memory, permissions, routing",
                  "paragraphId": "p3"
                },
                {
                  "id": "g8",
                  "text": "Exactly the same story in Teams",
                  "paragraphId": "p4"
                },
                {
                  "id": "g9",
                  "text": "THE AGENT FITS THE WAY THE TEAM ALREADY WORKS.",
                  "paragraphId": "p5"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "kybernesis-phase-1/11",
      "n": 11,
      "title": "The manager's morning briefing",
      "takeaway": "The manager starts with the important decisions, not an hour of information gathering.",
      "summary": "The most relatable of the twelve — a department head will see themselves in it.",
      "transcripts": [
        {
          "id": "tom-original",
          "kind": "provenance",
          "corpus": "tom-original",
          "talentId": null,
          "source": "src/shared/data/kybernesis-phase-1.source.json — Tom Lane’s Phase 1 handover",
          "topics": [
            {
              "id": "t1",
              "heading": "How the morning starts",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "How the morning starts",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "Let's do a practical one. Think about how a manager's morning usually starts — pinging three people, opening four systems, and building a picture in your head before you even know where you're actually needed."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "What the agents did overnight",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "Overnight, each agent",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "So what would we do instead? Overnight, each specialist agent looks at its own patch — whatever it's permitted to see. One's watching operations, one's watching the numbers, one's watching support. And each one flags anything that looks like an exception."
                    }
                  ]
                },
                {
                  "id": "t2.2",
                  "heading": "One short briefing",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "Then the orchestrator pulls all of that together into one short briefing, and that's what's waiting for you when you sit down. Not a data dump — the summary, and the red flags."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "Start on decisions",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "Start on decisions",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "So you start your day on the decisions, rather than spending the first hour working out which decisions there are."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": [
            {
              "style": "compressed-concept",
              "authoredBy": "hand",
              "note": "Carried over from the original Kybernesis prompter; the one surviving specimen. Not a settled rule — see docs/open-questions.md Q1.",
              "triggers": [
                {
                  "id": "g1",
                  "text": "A MANAGER'S MORNING: THREE PEOPLE, FOUR SYSTEMS, NO PICTURE YET.",
                  "paragraphId": "p1"
                },
                {
                  "id": "g2",
                  "text": "Building the picture before you know where you're needed",
                  "paragraphId": "p1"
                },
                {
                  "id": "g3",
                  "text": "Instead: overnight each specialist watches its own patch",
                  "paragraphId": "p2"
                },
                {
                  "id": "g4",
                  "text": "Operations · the numbers · support",
                  "paragraphId": "p2"
                },
                {
                  "id": "g5",
                  "text": "Each flags anything that looks like an exception",
                  "paragraphId": "p2"
                },
                {
                  "id": "g6",
                  "text": "The orchestrator pulls it into one short briefing",
                  "paragraphId": "p3"
                },
                {
                  "id": "g7",
                  "text": "Not a data dump — the summary and the red flags",
                  "paragraphId": "p3"
                },
                {
                  "id": "g8",
                  "text": "START ON THE DECISIONS, NOT AN HOUR OF INFORMATION GATHERING.",
                  "paragraphId": "p4"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "kybernesis-phase-1/12",
      "n": 12,
      "title": "Start with one, design for the system",
      "takeaway": "Prove value with one agent. Build the path to the full system from day one.",
      "summary": "The closer — what to actually do on Monday morning.",
      "transcripts": [
        {
          "id": "tom-original",
          "kind": "provenance",
          "corpus": "tom-original",
          "talentId": null,
          "source": "src/shared/data/kybernesis-phase-1.source.json — Tom Lane’s Phase 1 handover",
          "topics": [
            {
              "id": "t1",
              "heading": "How should you start?",
              "minors": [
                {
                  "id": "t1.1",
                  "heading": "How should you start?",
                  "paragraphs": [
                    {
                      "id": "p1",
                      "text": "So, to recap the whole approach — how should you actually start?"
                    }
                  ]
                },
                {
                  "id": "t1.2",
                  "heading": "Two ways to get it wrong",
                  "paragraphs": [
                    {
                      "id": "p2",
                      "text": "There are two ways to get this wrong. You can start too broadly, and end up with an expensive programme running for months before anybody's seen any value. Or you can start with an isolated little tool that works fine and goes absolutely nowhere."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t2",
              "heading": "What we'd recommend",
              "minors": [
                {
                  "id": "t2.1",
                  "heading": "What we'd recommend",
                  "paragraphs": [
                    {
                      "id": "p3",
                      "text": "What we'd recommend is neither. Pick one use case that genuinely matters — something where you can point at the value and everyone agrees it's real. Build that. But build it on the memory, the permissions, the tools and the orchestration that a bigger system was going to need anyway."
                    }
                  ]
                },
                {
                  "id": "t2.2",
                  "heading": "First proves itself",
                  "paragraphs": [
                    {
                      "id": "p4",
                      "text": "So the first agent proves itself on its own merits, and the second and third are additions rather than rebuilds."
                    }
                  ]
                }
              ]
            },
            {
              "id": "t3",
              "heading": "The close",
              "minors": [
                {
                  "id": "t3.1",
                  "heading": "The close",
                  "paragraphs": [
                    {
                      "id": "p5",
                      "text": "Prove value with one agent, and build the path to the full system from day one."
                    }
                  ]
                }
              ]
            }
          ],
          "triggerSets": [
            {
              "style": "compressed-concept",
              "authoredBy": "hand",
              "note": "Carried over from the original Kybernesis prompter; the one surviving specimen. Not a settled rule — see docs/open-questions.md Q1.",
              "triggers": [
                {
                  "id": "g1",
                  "text": "SO HOW SHOULD YOU ACTUALLY START?",
                  "paragraphId": "p1"
                },
                {
                  "id": "g2",
                  "text": "Too broad: months of programme before any value",
                  "paragraphId": "p2"
                },
                {
                  "id": "g3",
                  "text": "Too isolated: a tool that works and goes nowhere",
                  "paragraphId": "p2"
                },
                {
                  "id": "g4",
                  "text": "Neither — pick one use case that genuinely matters",
                  "paragraphId": "p3"
                },
                {
                  "id": "g5",
                  "text": "Something where everyone agrees the value is real",
                  "paragraphId": "p3"
                },
                {
                  "id": "g6",
                  "text": "Build it on memory, permissions, tools, orchestration",
                  "paragraphId": "p3"
                },
                {
                  "id": "g7",
                  "text": "The things a bigger system was going to need anyway",
                  "paragraphId": "p3"
                },
                {
                  "id": "g8",
                  "text": "Then two and three are additions, not rebuilds",
                  "paragraphId": "p4"
                },
                {
                  "id": "g9",
                  "text": "PROVE VALUE WITH ONE AGENT. BUILD THE PATH TO THE FULL SYSTEM FROM DAY ONE.",
                  "paragraphId": "p5"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export const TALENTS: Talent[] = [
  {
    "id": "david",
    "name": "David Cruwys",
    "envelope": {
      "wordsMin": 140,
      "wordsMax": 155,
      "breathGroupMeanMin": 10,
      "breaksPer100Max": 4.5,
      "sentenceSdMin": 13,
      "emDashMax": 0,
      "antiVoice": [
        "game changing",
        "revolutionary",
        "ultimate",
        "supercharge",
        "unleash",
        "unlock",
        "seamless",
        "10x",
        "mind blowing",
        "fast paced"
      ],
      "bookends": [
        "appydave",
        "like and subscribe",
        "see you in the next video"
      ],
      "source": "Measured from 318 punctuated transcripts / ~229,105 words of David’s own published video via verbal-style-forge; thresholds transcribed from ~/dev/ad/brains/kybernesis/phase-1-scripts/score.py (2026-08-19). Native cadence: 11.5-word breath groups, 3.27 breaks per 100 words."
    }
  }
];
