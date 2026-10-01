// Scripted Iris replies for the Stylist chat.
//
// There is no free-chat LLM yet (BUILD_SPEC §4.8 / DS §10.3). Until it
// lands, a typed message must still get an answer — a sent message that
// vanishes into an empty chat is the single worst moment in the product.
// This module is deterministic and keyword-based on purpose: it routes the
// user to the surface that CAN help today (moment composer, closet, saved,
// today's looks) instead of pretending to reason. Copy follows the Iris
// voice rules (DS §10.1: warm, specific, never a form; one idea per line).

export interface IrisAction {
  label: string;
  /** expo-router href to push. */
  route?: string;
  /** Text to drop into the composer instead of navigating. */
  prefill?: string;
}

export interface IrisReply {
  text: string;
  /** Caps suffix after "IRIS" on the message card, e.g. "A MOMENT". */
  suffix?: string;
  actions?: IrisAction[];
}

interface Rule {
  test: RegExp;
  reply: IrisReply;
}

const STYLE_MOMENT: IrisAction = { label: 'Style this moment', route: '/moment-composer' };
const OPEN_CLOSET: IrisAction = { label: 'Open my closet', route: '/(tabs)/closet' };
const TODAYS_LOOKS: IrisAction = { label: "See today's looks", route: '/(tabs)' };
const SAVED_LOOKS: IrisAction = { label: 'Saved looks', route: '/(tabs)/saved' };

const RULES: Rule[] = [
  {
    test: /\b(wedding|party|dinner|date night|date|brunch|trip|travel|interview|meeting|review|presentation|event|gala|concert|funeral|birthday)\b/i,
    reply: {
      suffix: 'A MOMENT',
      text: "A moment — my favourite kind of problem. Tell me when and where and I'll build the look around it, not the other way round.",
      actions: [STYLE_MOMENT, OPEN_CLOSET],
    },
  },
  {
    test: /\b(goes with|go with|pair|match|wear with|style (this|my|the))\b/i,
    reply: {
      suffix: 'PAIRING',
      text: "Pairing is where I earn my keep. If it's already in your closet I know it — pick the piece and I'll build around it. If it's new, attach a photo and I'll show it on you first.",
      actions: [OPEN_CLOSET, { label: 'Attach a photo', prefill: '__attach__' }],
    },
  },
  {
    test: /\b(rain|raining|cold|chilly|hot|heat|humid|weather|warm|snow|windy|sunny)\b/i,
    reply: {
      suffix: 'WEATHER',
      text: "I already read the forecast this morning — today's three looks are built for it. Want me to lean warmer, lighter, or more waterproof?",
      actions: [TODAYS_LOOKS, STYLE_MOMENT],
    },
  },
  {
    test: /\b(saved|favou?rites?|hearted|bookmark)\b/i,
    reply: {
      suffix: 'SAVED',
      text: 'Everything you heart lives under Saved — looks and single pieces. Nothing disappears unless you unheart it.',
      actions: [SAVED_LOOKS],
    },
  },
  {
    test: /\b(closet|wardrobe|own|already have|my clothes)\b/i,
    reply: {
      suffix: 'CLOSET',
      text: "What you own is already in my head — every look I build starts there. Add a piece and it's in rotation from the next morning.",
      actions: [OPEN_CLOSET, TODAYS_LOOKS],
    },
  },
  {
    test: /\b(colou?r|palette|undertone|season|analysis)\b/i,
    reply: {
      suffix: 'COLOUR',
      text: 'Your palette is set from onboarding and every look leans on it. If it feels off, redo the analysis under You — takes about a minute.',
      actions: [{ label: 'Open You', route: '/(tabs)/you' }, TODAYS_LOOKS],
    },
  },
  {
    test: /^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/i,
    reply: {
      text: "Hi. I'm best with something concrete — a moment on the calendar, a piece you're eyeing, or a maybe you can't decide on.",
      actions: [STYLE_MOMENT, TODAYS_LOOKS],
    },
  },
  {
    test: /\b(thanks|thank you|perfect|love it|great)\b/i,
    reply: {
      text: "Any time. I'll have tomorrow's looks ready before your alarm.",
      actions: [TODAYS_LOOKS],
    },
  },
];

const FALLBACK: IrisReply = {
  suffix: 'STILL LEARNING',
  text: "I can't free-chat yet — that part of me is still in training. Give me a moment or a piece and I'll do my best work.",
  actions: [STYLE_MOMENT, OPEN_CLOSET],
};

/** Deterministic, keyword-routed reply for a sent message. */
export function scriptedReply(message: string): IrisReply {
  const text = message.trim();
  for (const rule of RULES) {
    if (rule.test.test(text)) return rule.reply;
  }
  return FALLBACK;
}

/** Simulated "thinking" delay so the reply reads as considered, not canned (DS §9.2). */
export const IRIS_THINKING_MS = 700;
