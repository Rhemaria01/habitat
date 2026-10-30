/**
 * "What to do with what you feel" — feeling guides distilled from the
 * Mulank 5 simple life guide. The monkey-mind framing: the mind learns
 * fast and wants to explore everything, sometimes it jumps around and
 * gets tired. These cards turn that energy into concrete moves.
 */

export type FeelingGuide = {
  key: string;
  feeling: string;
  glyph: string;
  why: string;
  steps: string[];
  remember: string;
  action?: { label: string; href: string };
};

export const FEELING_GUIDES: FeelingGuide[] = [
  {
    key: "bored-wanting-new",
    feeling: "I keep wanting to switch to something new",
    glyph: "⤳",
    why: "The puzzle → toy → chocolate trap: at the end, nothing gets finished. The monkey-mind reads boredom as an emergency — it usually isn't.",
    steps: [
      "Choose one important task.",
      "Focus on it for 30 minutes.",
      "Don't switch just because you feel bored.",
      "Finish a small part before moving on.",
    ],
    remember: "Start one thing. Stay with it. Finish a small part.",
    action: { label: "Open Today", href: "/" },
  },
  {
    key: "phone-pull",
    feeling: "I keep reaching for my phone",
    glyph: "◷",
    why: "Every reel, notification, and video is like shaking a glass of water — if you keep shaking it, the water never becomes still.",
    steps: [
      "Keep your phone away while working.",
      "Don't open social media every time you feel bored.",
      "Spend 15–20 minutes daily without your phone.",
      "Walk, sit quietly, or look outside without needing entertainment.",
    ],
    remember:
      "You can feel bored without immediately doing something about it.",
    action: { label: "Find a phone-free habit to grow", href: "/habits" },
  },
  {
    key: "not-heard",
    feeling: "I have ideas but can't get people to hear them",
    glyph: "◉",
    why: "A skill is like a toy nobody knows about if you never show it to anyone.",
    steps: [
      "Explain your ideas clearly.",
      "Share your work with others.",
      "Build relationships with people in your field.",
      "Learn to present, negotiate, and solve problems.",
      "Become good at something valuable, then learn how to communicate its value.",
    ],
    remember: "Build valuable skills, then let people see them.",
    action: { label: "Adopt a communication practice", href: "/library" },
  },
  {
    key: "goal-turns-boring",
    feeling: "My goal has stopped being fun",
    glyph: "❍",
    why: "A seed needs time to grow. If you keep digging it up to plant another one, you won't get a flower.",
    steps: [
      "Don't abandon a good goal just because progress is slow.",
      "Avoid changing plans every time a new idea appears.",
      "Give worthwhile goals a fair amount of time.",
      "If something isn't working, change thoughtfully — not just to escape boredom.",
    ],
    remember:
      "Commitment means choosing to give something a fair chance; it doesn't mean being trapped.",
    action: { label: "Check your habits", href: "/habits" },
  },
  {
    key: "too-many-directions",
    feeling: "I'm pulled in too many directions",
    glyph: "✳",
    why: "If you keep walking east, west, and north while trying to reach the park, you may never get there.",
    steps: [
      "Choose one main goal for the next 90 days.",
      "Examples: improve at work, build a portfolio, learn a skill, or complete a project.",
      "Keep hobbies, but give your main goal consistent effort.",
      "Each week, ask: Did I move closer to my goal, or was I just busy?",
    ],
    remember:
      "You can have many interests, but give one priority your best effort.",
    action: { label: "Pick one habit to focus on", href: "/habits" },
  },
  {
    key: "silence-uncomfortable",
    feeling: "Quiet feels uncomfortable",
    glyph: "○",
    why: "If a mind needs a new cartoon every second, silence feels wrong. Practising quiet helps you become less dependent on constant stimulation.",
    steps: [
      "Sit quietly for 5–10 minutes each day.",
      "No phone, videos, or music during that time.",
      "Breathe normally and let thoughts come and go.",
      "Don't force your mind to become empty.",
    ],
    remember: "You don't have to react to every thought.",
    action: { label: "Grow a silence habit", href: "/habits" },
  },
  {
    key: "urge-to-run",
    feeling: "I want to run away from this situation",
    glyph: "➤",
    why: "Changing classrooms doesn't remove the heavy schoolbag if you carry it with you. Sometimes the problem needs to be understood, not escaped.",
    steps: [
      "Ask whether you're genuinely unhappy or just afraid of boredom or commitment.",
      "Notice if you're avoiding a difficult task or conversation.",
      "Decide what needs to change and what you need to learn to handle.",
      "Don't run from every difficult situation — but don't stay in unhealthy ones either.",
    ],
    remember:
      "Learn the difference between discomfort you can grow through and a situation you should leave.",
    action: { label: "Write tonight's review", href: "/" },
  },
];

export const DAILY_PLAN = [
  { when: "Morning", what: "Choose your one most important task." },
  {
    when: "During work",
    what: "Focus for 30 minutes without checking your phone.",
  },
  {
    when: "Afternoon",
    what: "Spend 10 minutes learning a career-helpful skill.",
  },
  { when: "Evening", what: "Walk for 15–20 minutes without scrolling." },
  { when: "Before bed", what: "Sit quietly for 5 minutes and review your day." },
];

export const MAIN_LESSON =
  "Don't chase something new every time you feel bored. Learn to stay with something worthwhile long enough to see what you can become.";

export const GUIDE_NOTE =
  "These are general self-improvement ideas, not scientifically established traits. Use the advice that genuinely helps you.";

export function rememberLineForDate(dateKey: string): string {
  const index =
    Number(dateKey.replace(/-/g, "")) % FEELING_GUIDES.length;
  return FEELING_GUIDES[index].remember;
}
