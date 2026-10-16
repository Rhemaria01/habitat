/**
 * Communication-skills practice library, researched from well-known books:
 * Carnegie, Patterson et al., Porter, Cabane, Rosenberg, Abrahams
 * (Stanford GSB), and Holiday. Each practice can be adopted as a habit
 * (daily or weekly) with one click — see `src/app/actions/library.ts`.
 */

import type { HabitFrequency } from "@/lib/types";

export type Practice = {
  key: string;
  text: string;
  frequency: HabitFrequency;
  /** A short execution hint shown under the practice. */
  suggestion: string;
};

export type Book = {
  key: string;
  title: string;
  author: string;
  idea: string;
  practices: Practice[];
};

export const COMMUNICATION_BOOKS: Book[] = [
  {
    key: "carnegie",
    title: "How to Win Friends and Influence People",
    author: "Dale Carnegie",
    idea: "People remember how you made them feel — genuine interest beats technique.",
    practices: [
      {
        key: "carnegie-compliment",
        text: "Give one sincere compliment",
        frequency: "daily",
        suggestion:
          "Find something specific someone did well and say it out loud — no flattery, just truth.",
      },
      {
        key: "carnegie-names",
        text: "Use a colleague's name in conversation",
        frequency: "daily",
        suggestion:
          "A person's own name is the sweetest sound in any language. Say it at the start or close of a talk.",
      },
      {
        key: "carnegie-question",
        text: "Ask one open question and truly listen",
        frequency: "daily",
        suggestion:
          "Ask about their work or plans, then listen without steering toward your own story.",
      },
      {
        key: "carnegie-no-argue",
        text: "Win a disagreement by yielding gracefully",
        frequency: "weekly",
        suggestion:
          "When you feel the urge to be right, try agreeing with the true part of their point first.",
      },
    ],
  },
  {
    key: "crucial-conversations",
    title: "Crucial Conversations",
    author: "Patterson, Grenny, McMillan, Switzler",
    idea: "High-stakes conversations work when everyone feels safe and shares a common purpose.",
    practices: [
      {
        key: "crucial-purpose",
        text: "Name the shared purpose before a hard talk",
        frequency: "weekly",
        suggestion:
          "Say out loud what you both want from the conversation before diving into the problem.",
      },
      {
        key: "crucial-story",
        text: "Retrace your story: facts vs. assumptions",
        frequency: "weekly",
        suggestion:
          "When upset, write the pure facts first, then notice what story you added on top.",
      },
    ],
  },
  {
    key: "small-talk",
    title: "The Fine Art of Small Talk",
    author: "Debra Fine",
    idea: "Conversation is a skill, not a talent — openers, follow-ups, and clean exits can be practised.",
    practices: [
      {
        key: "smalltalk-opener",
        text: "Start one low-stakes conversation",
        frequency: "daily",
        suggestion:
          "Barista, security guard, colleague you skip past: one open question, one genuine follow-up.",
      },
      {
        key: "smalltalk-exit",
        text: "Exit a conversation warmly",
        frequency: "weekly",
        suggestion:
          "Close with a reference to something they said: 'Good luck with that demo today.'",
      },
    ],
  },
  {
    key: "charisma-myth",
    title: "The Charisma Myth",
    author: "Olivia Fox Cabane",
    idea: "Charisma is presence, power, and warmth — trainable body-mind habits, not magic.",
    practices: [
      {
        key: "charisma-presence",
        text: "Full-focus listening in one conversation",
        frequency: "daily",
        suggestion:
          "One talk where your phone stays away and you give undivided attention, eye contact included.",
      },
      {
        key: "charisma-posture",
        text: "Open posture check before a meeting",
        frequency: "daily",
        suggestion:
          "Shoulders back, chin level, uncrossed arms — 60 seconds of this before you walk in.",
      },
      {
        key: "charisma-pause",
        text: "Pause two seconds before reacting",
        frequency: "weekly",
        suggestion:
          "In one discussion, let the silence land before you answer. It reads as composure.",
      },
    ],
  },
  {
    key: "nvc",
    title: "Nonviolent Communication",
    author: "Marshall Rosenberg",
    idea: "Observation → feeling → need → request, without blame.",
    practices: [
      {
        key: "nvc-reframe",
        text: "Reframe one complaint into a need + request",
        frequency: "weekly",
        suggestion:
          "'You never listen' becomes 'I felt unheard when X — would you be willing to Y?'",
      },
    ],
  },
  {
    key: "think-fast-talk-smart",
    title: "Think Fast, Talk Smart",
    author: "Matt Abrahams (Stanford GSB)",
    idea: "Structure beats speed — anchor, engage, land it.",
    practices: [
      {
        key: "talks-impromptu",
        text: "Record a 2-minute impromptu talk",
        frequency: "weekly",
        suggestion:
          "Pick any object in the room and speak on it for 2 minutes. Listen back once, keep notes.",
      },
      {
        key: "talks-structure",
        text: "Frame one update as what → so what → now what",
        frequency: "weekly",
        suggestion:
          "Use the three-part frame in a standup or message so your point lands in one breath.",
      },
    ],
  },
  {
    key: "stillness",
    title: "Stillness Is the Key",
    author: "Ryan Holiday",
    idea: "Calm is a trainable state — silence and one-task-at-a-time carry into how you speak.",
    practices: [
      {
        key: "stillness-sit",
        text: "Sit quietly for 5–10 minutes",
        frequency: "daily",
        suggestion:
          "No phone, no music. Breathe normally and let thoughts pass without reacting.",
      },
    ],
  },
];

/** One-click goal template that bundles the core communication practices. */
export const COMMUNICATOR_TEMPLATE = {
  key: "template-communicator",
  title: "Become a better communicator",
  identityStatement: "I am someone who connects with people",
  why: "Valuable skills only count once people can hear them — presence first, then expression.",
  practiceKeys: [
    "carnegie-question",
    "charisma-presence",
    "smalltalk-opener",
    "talks-impromptu",
  ],
};

export function findPractice(key: string): Practice | null {
  for (const book of COMMUNICATION_BOOKS) {
    const hit = book.practices.find((p) => p.key === key);
    if (hit) return hit;
  }
  return null;
}
