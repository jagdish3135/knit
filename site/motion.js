// Knit's one motion system. The CSS twins of these live in tokens.css (--ease-*, --dur-*).
// Everything moves with these: text reveals, hovers, the weave timeline, the cursor, the page wipe.
export const ease = {
  out: "expo.out",          // --ease-out   cubic-bezier(.16,1,.3,1)
  inOut: "power3.inOut",    // --ease-in-out cubic-bezier(.65,0,.35,1)
  tug: "back.out(1.6)",     // --ease-tug   cubic-bezier(.34,1.56,.64,1)
  none: "none",
};
export const dur = { 1: 0.12, 2: 0.2, 3: 0.4, 4: 0.6 };   // seconds; --dur-1..4 in ms
export const stagger = { words: 0.035, lines: 0.08, cards: 0.06 };

const mq = (q) => typeof matchMedia === "function" && matchMedia(q).matches;
export const reducedMotion = () => mq("(prefers-reduced-motion: reduce)");
export const finePointer = () => mq("(hover: hover) and (pointer: fine)");

// Split a heading into lines (SplitText) and lift them in, once, when it enters the viewport.
export function revealLines(gsap, SplitText, el, opts = {}) {
  const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "ln", autoSplit: true,
    onSplit: (self) => gsap.from(self.lines, {
      yPercent: 110, duration: dur[4] * 1.6, ease: ease.out, stagger: stagger.lines,
      scrollTrigger: opts.immediate ? undefined : { trigger: el, start: "top 88%", once: true },
      delay: opts.delay ?? 0,
    }),
  });
  return split;
}

// Fade-and-lift for blocks of copy and cards.
export function revealUp(gsap, targets, trigger) {
  // Opacity only (never visibility), so content waiting to reveal stays in the Tab order.
  return gsap.from(targets, { y: 28, opacity: 0, duration: dur[4] * 1.4, ease: ease.out, stagger: stagger.cards,
    scrollTrigger: { trigger: trigger ?? targets, start: "top 90%", once: true } });
}
