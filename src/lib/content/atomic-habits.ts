/**
 * Atomic Habits (James Clear) helper content used in the Goals UI.
 * Four Laws of Behavior Change + identity framing, kept short and
 * actionable so each goal page can coach the next step.
 */

export type Law = {
  key: string;
  title: string;
  hint: string;
  prompts: string[];
};

/** The four laws for building a good habit. */
export const BUILD_LAWS: Law[] = [
  {
    key: "obvious",
    title: "Make it obvious",
    hint: "Design the cue — a habit needs a trigger you can't miss.",
    prompts: [
      "Fill in the implementation intention: 'I will [BEHAVIOR] at [TIME] in [LOCATION].'",
      "Stack it: 'After [CURRENT HABIT], I will [NEW HABIT].'",
      "Put the cues for this habit where you'll see them today.",
    ],
  },
  {
    key: "attractive",
    title: "Make it attractive",
    hint: "Pair the action with something you want to do.",
    prompts: [
      "Bundle temptation: only let yourself do the thing you love while doing the thing you need.",
      "Join (or imagine) a group for which this habit is normal behaviour.",
    ],
  },
  {
    key: "easy",
    title: "Make it easy",
    hint: "Reduce friction; start with the 2-minute version.",
    prompts: [
      "What is the 2-minute version of this task? Do that first.",
      "Prepare the environment now so the habit is the easiest choice later.",
      "Scale it down, don't quit: a tiny rep keeps the identity vote alive.",
    ],
  },
  {
    key: "satisfying",
    title: "Make it satisfying",
    hint: "Give yourself an immediate signal that you showed up.",
    prompts: [
      "Check it off the same day — the streak itself is the reward.",
      "Never miss twice: one slip is an accident, two is the start of a new habit.",
    ],
  },
];

/** The inverted four laws for quitting a bad habit. */
export const QUIT_LAWS: Law[] = [
  {
    key: "invisible",
    title: "Make it invisible",
    hint: "Remove the cue from your environment.",
    prompts: [
      "Where does the urge come from? Hide or remove that trigger today.",
    ],
  },
  {
    key: "unattractive",
    title: "Make it unattractive",
    hint: "Reframe the craving — list what it actually costs you.",
    prompts: [
      "Write one sentence about what this habit prevents you from becoming.",
    ],
  },
  {
    key: "hard",
    title: "Make it difficult",
    hint: "Add friction between you and the behaviour.",
    prompts: [
      "What extra step (or person) could stand between the urge and the action?",
    ],
  },
  {
    key: "unsatisfying",
    title: "Make it unsatisfying",
    hint: "Add an immediate cost to slipping.",
    prompts: [
      "A habit contract: tell someone your quit date; slips get reported the same day.",
    ],
  },
];

export const IDENTITY_FRAME =
  "Every check-in is evidence. You're not just completing a task — each one is a vote for the person your identity statement describes.";

export const STACK_TEMPLATE = "After I ___, I will ___.";

export const TWO_MINUTE_RULE =
  "The first two minutes of starting. A goal to read before bed becomes 'open the book'. Master the art of showing up before worrying about optimising.";

export const WEEKLY_REVIEW_QUESTION =
  "Did I move closer to my goal this week, or was I just busy?";
