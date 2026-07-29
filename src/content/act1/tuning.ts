/**
 * =========================================================================
 *  PROVISIONAL. NOT MEASUREMENTS. NOT BALANCED. DO NOT CITE ANY OF THIS.
 * =========================================================================
 *
 * Every Vmax, every Km, and the one Hill coefficient in act 1. All of them, in
 * this file, and nowhere else. If a rate appears anywhere outside this file,
 * that is the bug.
 *
 * WHAT THESE NUMBERS ARE. First-fit values chosen so the act 1 pathway runs at
 * all. They were picked by reasoning about which step should be rate-limiting
 * and then checking the pathway does not deadlock at startup. They are not
 * tuned for pacing, they have never been played, and no player has ever seen
 * them.
 *
 * WHAT THESE NUMBERS ARE NOT. They are not laboratory measurements and they
 * are not derived from any. docs/SCIENCE.md Part 1 is explicit about why:
 * literature Km and Vmax values vary by an order of magnitude across organism,
 * tissue, pH, temperature and assay method, so presenting one as authoritative
 * would be less honest than not using literature values at all. That document
 * forbids the game implying otherwise, and the required in-game disclosure text
 * says in as many words that rates are tuned and are not measured values.
 *
 * Contrast this with the stoichiometry in reactions.ts, every coefficient of
 * which traces to docs/SCIENCE.md Part 2. Stoichiometry is sourced. Rates are
 * not. That split is the whole sourcing posture of the project and this file is
 * the side of it that owes a debt.
 *
 * THE DEBT. Every value below owes a row in the divergence table in
 * docs/ECONOMY.md once that document exists. It does not exist yet and should
 * not: NOW.md is explicit that it needs a playable prototype first, and V2 has
 * no interface, so nothing here has been balanced against anything a player
 * does. The tension with CLAUDE.md hard rule 2 is real and is recorded rather
 * than resolved. Introduced by UPDATELOGV2.md, stage 3.
 *
 * Rates are in pool units per game-second. Km and K are in pool units.
 */

import type { Act1ReactionId } from './reactions';

/**
 * Maximum velocity per reaction.
 *
 * The ordering is the design, not the magnitudes. `uptake` is deliberately the
 * slowest step, so the pathway is substrate-limited from the top and the
 * downstream steps sit at whatever saturation matches their supply. Every
 * downstream Vmax has headroom over the flux actually reaching it, which is
 * what lets a real constraint show up as a constraint instead of being masked
 * by an arbitrarily low ceiling somewhere else.
 *
 * `payoff` is above twice `prep` because the preparatory phase hands it two
 * trioses per glucose, so two payoff turns run per prep turn.
 *
 * `maintain` is sized so it can consume the entire net ATP production of the
 * pathway without ATP piling up against the fixed adenylate total. If it could
 * not, ADP would run out and glycolysis would stall on the adenylate ceiling
 * instead of on NAD+, which would put the wrong wall in front of the player.
 */
export const ACT1_VMAX: Readonly<Record<Act1ReactionId, number>> = {
  uptake: 8,
  prep: 12,
  payoff: 26,
  ferment: 26,
  maintain: 50,
};

/**
 * Half-saturation constant per reaction. Michaelis-Menten Km, and the Hill K
 * for `prep`, which is the same quantity playing the same role.
 *
 * One value per reaction, shared across every substrate of that reaction. That
 * is a disclosed simplification, not an oversight: see docs/SCIENCE.md Part 1,
 * "One Km per reaction, shared across all of its substrates".
 *
 * The consequence is that these numbers cannot be read in isolation. `payoff`
 * at 2 has to sit well below the nicotinamide total, because NAD+ is one of its
 * four substrates and a Km near that pool's whole size would mean the payoff
 * phase never approaches Vmax even with the carrier fully oxidised. `uptake` at
 * 500 is large only because the environmental pool it draws on is large.
 */
export const ACT1_KM: Readonly<Record<Act1ReactionId, number>> = {
  uptake: 500,
  prep: 4,
  payoff: 2,
  ferment: 2,
  maintain: 20,
};

/**
 * Hill coefficient for the preparatory phase. Integer, because
 * docs/SIMULATION.md Part 5 bans Math.pow and the kernel raises to integer
 * powers by repeated multiplication.
 *
 * 2 is the smallest value that produces a sigmoid at all, and nothing has
 * measured what act 1 wants. See the attribution note in reactions.ts: the
 * cooperativity being modeled is PFK-1's, and it is attached to the whole
 * preparatory phase because the phase is not decomposed into individual
 * enzymes in this log.
 */
export const ACT1_HILL_N = 2;

/**
 * Size of the nicotinamide pool, NAD+ plus NADH. Act 1's ceiling on everything.
 *
 * SOURCED: that the pool is small and fixed, and that glycolysis halts within
 * seconds if NADH is not reoxidised regardless of glucose availability.
 * docs/SCIENCE.md Part 2 line 108.
 *
 * NOT SOURCED: how small. That number is ours and it lives here with the rates
 * rather than in pools.ts, because it is a tuned quantity wearing a pool's
 * clothes. Sized against how long the stall takes to arrive with `ferment`
 * disabled, which is the only thing about it that matters.
 *
 * Raised from 10 to 30 in UPDATELOGV2.md stage 4. At 10 the pathway stalled at
 * roughly 1.7 game-seconds, which is inside the sourced "within seconds" but
 * arrives before the pathway has visibly finished starting up: the payoff phase
 * peaks and dies in the same breath, so there is no interval during which a
 * player can see a working cell to lose. At 30 the pathway reaches full flux,
 * holds it, and then decays, which is a stall rather than a failure to launch.
 *
 * All of it starts as NAD+. The pool is fully oxidised at t=0, so the wall is
 * approached rather than started at.
 */
export const ACT1_NICOTINAMIDE_TOTAL = 30;
