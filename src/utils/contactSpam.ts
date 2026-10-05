/**
 * Spam screening for the website contact form.
 *
 * Every check is a cheap local heuristic: no third-party service, no network
 * call. Each check is strong enough to reject on its own, so a submission is
 * spam as soon as any one of them fires. Weaker signals that would only make
 * sense as tie-breakers (a dotted Gmail address, name equal to message, a
 * missing fill-time field) are deliberately left out so that a real visitor is
 * never refused on one of them.
 *
 * Tuned for the junk observed Jul–Sep 2026: name and message are random
 * mixed-case letter strings ("nyngTjdJVkQieWDxVupkinG") sprayed across several
 * pages a minute apart.
 */

export interface ContactSubmission {
  name: string;
  message: string;
  /** Hidden input real visitors never see; bots that fill every input fill it. */
  honeypot?: string;
  /** Milliseconds between the form rendering and being submitted, measured in the browser. */
  elapsedMs?: number;
}

export interface SpamVerdict {
  isSpam: boolean;
  /** One line per check that fired; empty when the submission passed. */
  reasons: string[];
}

/**
 * The form has four required text fields and a required consent checkbox. Even
 * with browser autofill and a pasted message a person needs several seconds of
 * clicking; headless bots submit in a few hundred milliseconds.
 */
const MIN_FILL_TIME_MS = 2000;

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

export const screenContactSubmission = (submission: ContactSubmission): SpamVerdict => {
  const reasons: string[] = [];

  if (submission.honeypot?.trim()) {
    reasons.push('hidden honeypot field was filled in');
  }

  if (submission.elapsedMs !== undefined && submission.elapsedMs < MIN_FILL_TIME_MS) {
    reasons.push(`submitted ${submission.elapsedMs}ms after the form loaded`);
  }

  if (looksLikeRandomLetters(submission.name)) {
    reasons.push('name looks like random letters');
  }

  if (looksLikeRandomLetters(submission.message)) {
    reasons.push('message looks like random letters');
  }

  return { isSpam: reasons.length > 0, reasons };
};
