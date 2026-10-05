/**
 * Spam screening for the website contact form.
 *
 * Every rule is a cheap local heuristic: no third-party service, no network
 * call. Each rule adds points to a score and the submission counts as spam once
 * the score reaches REJECT_SCORE. Most rules are worth less than REJECT_SCORE
 * on their own, so one weak signal never blocks a real visitor.
 *
 * Tuned for the junk observed Jul–Sep 2026: name and message are random
 * mixed-case letter strings ("nyngTjdJVkQieWDxVupkinG"), the email is a Gmail
 * address with many dots ("da.t.oz.o.risi.5.9@gmail.com"), and the same payload
 * is sprayed across several pages a minute apart.
 */

export interface ContactSubmission {
  name: string;
  email: string;
  phone: string;
  message: string;
  /** Hidden input real visitors never see; bots that fill every input fill it. */
  honeypot?: string;
  /** Milliseconds between the form rendering and being submitted, measured in the browser. */
  elapsedMs?: number;
}

export interface SpamVerdict {
  isSpam: boolean;
  score: number;
  reasons: string[];
}

export const REJECT_SCORE = 3;

/** A person needs well over this to type a name, email, phone number and message. */
const MIN_FILL_TIME_MS = 3000;

/** Real local parts rarely have more than two dots; the bot abuses the Gmail dot trick. */
const MAX_LOCAL_PART_DOTS = 2;

/**
 * True for values like "nyngTjdJVkQieWDxVupkinG": one or two words made only of
 * ASCII letters, at least 8 long, with three or more lower→upper case switches
 * inside a word, or no vowels at all. Real names ("McDonald", "VanDerBerg")
 * have at most two switches, and names with accents never match.
 */
export const looksLikeRandomLetters = (value: string): boolean => {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 2) return false;

  return words.some((word) => {
    if (word.length < 8 || !/^[A-Za-z]+$/.test(word)) return false;
    const caseSwitches = (word.match(/[a-z][A-Z]/g) ?? []).length;
    const vowels = (word.match(/[aeiouy]/gi) ?? []).length;
    return caseSwitches >= 3 || vowels === 0;
  });
};

const localPartDots = (email: string): number => {
  const atIndex = email.lastIndexOf('@');
  if (atIndex <= 0) return 0;
  return (email.slice(0, atIndex).match(/\./g) ?? []).length;
};

export const screenContactSubmission = (submission: ContactSubmission): SpamVerdict => {
  const reasons: string[] = [];
  let score = 0;

  const add = (points: number, reason: string) => {
    score += points;
    reasons.push(reason);
  };

  if (submission.honeypot && submission.honeypot.trim() !== '') {
    add(REJECT_SCORE, 'honeypot field was filled in');
  }

  if (submission.elapsedMs === undefined) {
    add(1, 'no fill-time measurement (form script bypassed)');
  } else if (submission.elapsedMs < MIN_FILL_TIME_MS) {
    add(2, `submitted ${submission.elapsedMs}ms after the form loaded`);
  }

  if (looksLikeRandomLetters(submission.name)) {
    add(2, 'name looks like random letters');
  }

  if (looksLikeRandomLetters(submission.message)) {
    add(2, 'message looks like random letters');
  }

  if (submission.name.trim().toLowerCase() === submission.message.trim().toLowerCase()) {
    add(1, 'name and message are identical');
  }

  if (localPartDots(submission.email) > MAX_LOCAL_PART_DOTS) {
    add(1, 'email address has an unusual number of dots');
  }

  return { isSpam: score >= REJECT_SCORE, score, reasons };
};
