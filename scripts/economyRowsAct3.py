import io, re

t = io.open('src/content/act3/tuning.ts', encoding='utf-8').read()


def rec(name):
    m = re.search(r'export const %s = \{(.*?)\n\} as const;' % name, t, re.S)
    return re.findall(r'^\s*([a-z_0-9]+):\s*([0-9.]+),', m.group(1), re.M)


vmax = rec('ACT3_VMAX')
km = rec('ACT3_KM')

VWHY = {
 'uptake': ('Eukaryotic glucose transporters are a family with distinct affinities. docs/SCIENCE.md Part 1, "Glucose uptake is modeled as untyped transport"',
   "Act 1's C1 unchanged. The cell did not get better at taking glucose in and this act is not about that. Keeping it equal to C1 is what makes act 3's yield comparable to act 1's at all: the same glucose per second, a different fate for it"),
 'prep': ('Preparatory phase, five enzymes with five rates. docs/SCIENCE.md Part 2',
   "Act 1's C2 unchanged, for C26's reason"),
 'payoff': ('Payoff phase, five enzymes. docs/SCIENCE.md Part 2',
   "Act 1's C3 unchanged, for C26's reason. Still above twice `prep`, because the preparatory phase still hands it two trioses per glucose"),
 'pyruvate_transport': ('The mitochondrial pyruvate carrier, MPC1 and MPC2, importing in symport with a proton. docs/SCIENCE.md Part 4',
   'Runs twice per glucose, so it is sized above `payoff` with headroom. Transport must never be the bottleneck, or the act teaches that a carrier is slow rather than that a compartment costs gradient'),
 'pdh': ('The pyruvate dehydrogenase complex, three enzymes and five cofactors, switched off by phosphorylation. docs/SCIENCE.md Part 4',
   'One rate for the whole complex, which is honest rather than lumped: the assembly is one machine and its intermediates never leave it. No regulation term, because `Kinetics` has none'),
 'tca': ('Eight enzymes at eight rates, three of them regulated. docs/SCIENCE.md Part 4, "The eight steps, decomposed"',
   'One rate for the whole cycle, exactly as act 1 carries one rate per glycolytic phase. Runs twice per glucose'),
 'complex_1': ('NADH:ubiquinone oxidoreductase, pumping four protons per pair. docs/SCIENCE.md Part 4',
   '**Ten runs per glucose on the malate-aspartate route, which is why it is an order of magnitude above glycolysis.** This is the number the first version of this file got wrong: sized to look like act 1s constants, the cell measured out pinned at the cytosolic NAD+ wall with 1565 glucose piled up inside it'),
 'complex_2': ('Succinate dehydrogenase, which is also step 6 of the cycle and the only one of its enzymes in the membrane. It pumps nothing. docs/SCIENCE.md Part 4',
   'Two runs per glucose, so it needs a fraction of complex Is capacity. Held at 30 rather than lower for headroom'),
 'complex_3': ('Cytochrome bc1 and the Q cycle. docs/SCIENCE.md Part 4',
   'Twelve runs per glucose: every pair passes through it whichever complex it entered at. The busiest reaction in the chain, with complex IV'),
 'complex_4': ('Cytochrome c oxidase, the terminal step. docs/SCIENCE.md Part 4',
   'Twelve runs per glucose, matching complex III because every pair that reaches III reaches IV'),
 'atp_synthase': ('F1Fo ATP synthase, a rotary motor making three ATP per revolution. docs/SCIENCE.md Part 4',
   '**Twenty-seven runs per glucose, which is the ledgers own figure.** Sized so the gradient settles at a working level rather than being drained: too high and the synthase outcompetes the pyruvate carrier for protons and the cell starves itself of substrate'),
 'ant': ('The adenine nucleotide translocase, exchanging matrix ATP for cytosolic ADP. docs/SCIENCE.md Part 4',
   'Thirty-one runs per glucose, which is every ATP the cytosol ever sees. It must never be the bottleneck, or matrix ATP piles up and the cell that made it cannot spend it'),
 'pi_transport': ('The mitochondrial phosphate carrier. docs/SCIENCE.md Part 4',
   'Matches `ant`, because every export strips a phosphate from the matrix and this is what puts it back. **Measured rather than reasoned about: without this reaction `pi_matrix` drains to zero, the synthase stops for want of substrate, and every proton in the cell ends up outside at 400.00 of 400**'),
 'shuttle_malate_aspartate': ('Four enzymes and two carriers. docs/SCIENCE.md Part 4, "The two NADH shuttles"',
   '**Equal to the other shuttle, and the equality is the row**, exactly as act 1s C18 is equal to C4. Part 1 refuses literature rates, so nothing sources a reason to make either faster, and unequal constants would settle act 3s real choice on a number nobody can check. Two runs per glucose'),
 'shuttle_glycerol_phosphate': ('Two dehydrogenases, one cytosolic and one in the membrane facing the intermembrane space. docs/SCIENCE.md Part 4',
   'Equal to the malate-aspartate shuttle. See C39. The two differ by four protons per pair and in nothing else here, which is what makes the choice about the entry point rather than about speed'),
 'maintain': ('ATP hydrolysis to ADP and phosphate is real stoichiometry. That a cell does it at one saturating rate is not: this reaction stands in for the entire rest of cellular metabolism',
   "Sized to consume act 3's whole net production of roughly 248 per game-second, against act 1's 32. **It is one half of act 3's bootstrap trap**: at this rate against act 1's adenylate total of 40 the cell empties in a fraction of a second, before the pathway has spun up at all. See C63 and C56"),
}

KWHY = {
 'uptake': "Act 1's C6 unchanged. Large only because the pool it draws on is large",
 'prep': "Act 1's C7 unchanged. A Hill K rather than a Michaelis-Menten Km",
 'payoff': "Act 1's C8 unchanged, sitting well below the nicotinamide total for C8's reason",
 'pyruvate_transport': 'Low, so transport saturates on whatever pyruvate glycolysis delivers. Shared across pyruvate and the proton by the one-Km simplification, which here means a cell short of EITHER stops importing sharply, and that coupling is what the act is about',
 'pdh': 'Low, matching the transport step it follows',
 'tca': 'Low, so the cycle saturates on acetyl-CoA rather than gating on it',
 'complex_1': 'Low, so the chain runs at capacity on whatever carrier reaches it. The chain has to be limited by its Vmax rather than by its affinity, or the pile-up stage 4 measured would be a saturation artifact rather than a rate one',
 'complex_2': 'As C48',
 'complex_3': 'As C48',
 'complex_4': '**Half of the placeholder rule.** `ACT3_OXYGEN_SATURATION` is 100 times this number, which is what makes the terminal saturation term 0.9901. The two cannot be read apart. See C25',
 'atp_synthase': "**The gradient's threshold, and it is the act's teaching beat written as a constant.** At 60 against a resting gradient of 20 with Hill order 3 the saturation term is 0.036, so the resting cell makes essentially no ATP from its gradient and the chain has to raise it. A low K here would let ATP trickle from the first proton, and there would be no moment where the pile is visibly building while nothing comes out",
 'ant': 'Low, so export tracks whatever the matrix holds',
 'pi_transport': 'Matches `ant`, for `ant`s reason',
 'shuttle_malate_aspartate': 'Mirrors `payoff` against the same cytosolic NADH. Equal to the other shuttle, for the reason in C39',
 'shuttle_glycerol_phosphate': 'Equal to the malate-aspartate shuttle. See C39',
 'maintain': "**60 rather than act 1's 12, and it is the other half of the bootstrap repair.** Maintenance has to back off across a band the cell actually operates in. At act 1's 12 against act 3's much larger adenylate pool it runs at nearly full rate all the way down, and the cell cannot climb out of a low-ATP state",
}

ORDER = ['ACT3_HILL_N', 'ACT3_MAINTAIN_HILL_N', 'ACT3_SYNTHASE_HILL_N', 'ACT3_NICOTINAMIDE_TOTAL',
         'ACT3_NICOTINAMIDE_MATRIX_TOTAL', 'ACT3_FLAVIN_TOTAL', 'ACT3_QUINONE_TOTAL',
         'ACT3_CYTOCHROME_TOTAL', 'ACT3_COA_TOTAL', 'ACT3_PROTON_TOTAL', 'ACT3_PROTON_IMS_INITIAL',
         'ACT3_ATP_INITIAL', 'ACT3_ADP_INITIAL', 'ACT3_PI_INITIAL', 'ACT3_ATP_MATRIX_INITIAL',
         'ACT3_ADP_MATRIX_INITIAL', 'ACT3_PI_MATRIX_INITIAL', 'ACT3_GLUCOSE_ENV_INITIAL']

SWHY = {
 'ACT3_HILL_N': ('PFK-1 shows cooperative sigmoidal kinetics. docs/SCIENCE.md Part 2, Regulation. **No Hill coefficient is stated anywhere in docs/SCIENCE.md**',
   "Act 1's C11 unchanged, carrying the same disclosed attribution: correct about which enzyme is cooperative, wrong about what the cooperativity is attached to"),
 'ACT3_MAINTAIN_HILL_N': ('Nothing. `maintain` is not a real step. **A real cell can be too ATP-poor to start glycolysis and really does die that way**',
   "Act 1's C14 unchanged. 3 is the smallest integer that strictly dominates `prep`s order 2 in ATP, which is what stops consumption beating production at low ATP"),
 'ACT3_SYNTHASE_HILL_N': ('A real proton-motive force has to exceed the phosphorylation potential before the rotor turns at all, so the response to gradient is switch-like rather than hyperbolic. docs/SCIENCE.md Part 4. **No exponent is stated**',
   "**The one kinetic choice in act 3 that is a design decision rather than an inheritance.** A hyperbolic synthase destroys the act's teaching beat, because ATP would trickle from the first proton. 3 rather than 2 because 2 is not sharp enough for the threshold to read as one. The shape is sourced and the exponent is ours"),
 'ACT3_NICOTINAMIDE_TOTAL': ('**Sourced: the cellular pool is small and fixed and glycolysis halts within seconds if NADH is not reoxidised.** docs/SCIENCE.md Part 2, The NAD+ constraint. Not sourced: how small',
   "Act 1's C12 unchanged at 30. Act 3 meets the same wall with a different answer, the shuttles rather than fermentation, and that reuse is the point"),
 'ACT3_NICOTINAMIDE_MATRIX_TOTAL': ('Mitochondria hold their own nicotinamide pool, physically separate from the cytosolic one and not freely exchanged, which is why the shuttles exist at all. docs/SCIENCE.md Part 4. How large is ours',
   '40, above the cytosolic 30, because the matrix carries ten of the twelve pairs per glucose and the cytosol carries two'),
 'ACT3_FLAVIN_TOTAL': ('FAD is a tightly bound prosthetic group of succinate dehydrogenase rather than a freely diffusing pool. docs/SCIENCE.md Part 4',
   '20, and modelling it as a pool at all is the departure rather than the number. Two pairs per glucose pass through it, so it only has to be large enough not to be the bottleneck'),
 'ACT3_QUINONE_TOTAL': ('The ubiquinone pool is dissolved in the inner membrane and genuinely is a pool, which is unusual among these carriers. docs/SCIENCE.md Part 4',
   '30. **Every one of the twelve pairs per glucose passes through it**, so it is the busiest carrier in the cell and is sized above the flavin'),
 'ACT3_CYTOCHROME_TOTAL': ('Cytochrome c is a small soluble protein in the intermembrane space and it is a ONE-electron carrier, which is what the Q cycle exists to handle. docs/SCIENCE.md Part 4',
   '30, counted in PAIRS rather than in molecules, so one unit here is two cytochromes. The one-electron nature is a real property this model does not represent, and counting pairs is what keeps the conserved weights integers'),
 'ACT3_COA_TOTAL': ('Coenzyme A is a small fixed matrix pool cycling between free and acylated forms. docs/SCIENCE.md Part 4',
   '20. Two acetyl-CoA per glucose, so it cycles rather than accumulates, and it is a carrier in exactly the sense NAD+ is'),
 'ACT3_PROTON_TOTAL': ('**The real gradient is mostly membrane voltage and only slightly a concentration difference**, at roughly 150 to 180 millivolts against under one pH unit, and the intermembrane space is not a sealed room. docs/SCIENCE.md Part 4, "The proton-motive force is mostly voltage, not concentration"',
   '**A fixed number of protons split between two pools, which is act 3s central departure and is taken deliberately.** A voltage across a membrane is not something a player can be given a count of, and an amount is what the player builds and spends. What it buys is that the gradient is a difference across a fixed total rather than a resource that appears, which the conservation test can check and DESIGN.md illustration rule 9 can draw'),
 'ACT3_PROTON_IMS_INITIAL': ('A living cell always has a membrane potential, and a newly acquired endosymbiont is a bacterium that has been maintaining its own all along',
   '**Act 3s bootstrap trap and its repair.** The pyruvate carrier imports in symport with a proton, so with every proton starting in the matrix nothing crosses in, nothing pumps, and no proton ever reaches the outside. Measured at 0: tick 4000 with `proton_ims` still exactly 0 and every matrix pool untouched. At 20 against a synthase K of 60 the resting saturation term is 0.036, so the cell can feed its compartment and cannot yet get anything out of it'),
 'ACT3_ATP_INITIAL': ('Cells hold a real adenylate pool at a real ATP to ADP ratio, and both vary with energy state. Nothing about either is in docs/SCIENCE.md',
   "**Ten times act 1's C15, and it is one half of the bootstrap repair.** Act 3 produces roughly 248 ATP per game-second against act 1's 32, so its maintenance reaction is sized to match, and that reaction against act 1's adenylate total of 40 empties the cell before the pathway spins up. Measured at 20: tick 4000 with `atp` at 0.018 and 1586 glucose piled up inside a cell climbing out at 1e-4 per second. A larger cell holding more of everything is also the truer statement"),
 'ACT3_ADP_INITIAL': ('As C63',
   'With C63 this fixes the cytosolic adenylate total at 400, and that total being fixed and closed is the reason ATP is a flux and not a score. Half and half commits to neither, exactly as act 1s C15 and C16 do'),
 'ACT3_PI_INITIAL': ('Cells hold a real free phosphate concentration. Not in docs/SCIENCE.md',
   'A buffer rather than a supply, at 200. It has to be large enough that the payoff phase is never short of it and that the phosphate carrier always has something to import'),
 'ACT3_ATP_MATRIX_INITIAL': ('As C63, for the matrix pool, which is genuinely separate from the cytosolic one',
   '50. The matrix adenylate pool is smaller than the cytosolic one because it turns over rather than accumulates: every ATP the synthase makes leaves through the translocase within a fraction of a game-second'),
 'ACT3_ADP_MATRIX_INITIAL': ('As C66',
   'With C66 this fixes the matrix adenylate total at 100. Half and half, for C64s reason'),
 'ACT3_PI_MATRIX_INITIAL': ('As C65, for the matrix pool',
   '100. Consumed by the synthase and by the cycle and replaced by the phosphate carrier, so it is a buffer against that carriers rate rather than a supply'),
 'ACT3_GLUCOSE_ENV_INITIAL': ('Not covered by docs/SCIENCE.md. A closed unreplenished pool is a departure from the informal picture rather than from a sourced number',
   "Act 1's C13 unchanged at 80000, finite, never replenished. **It buys far less time here than it does in act 1**, because act 3 extracts roughly fifteen times the ATP from each glucose and burns through them accordingly. How long it lasts is a pacing measurement and stage 5 owns it"),
}

rows = []
n = 26
for k, v in vmax:
    real, why = VWHY[k]
    rows.append('| C%d | %s | `ACT3_VMAX.%s` | %s | %s pool units per game-second | %s | V14 stage 4 |'
                % (n, v, k, real, v, why))
    n += 1
first_km = n
for k, v in km:
    real = ('An enzyme has a separate Km for each substrate. docs/SCIENCE.md Part 1, "One Km per reaction, shared across all of its substrates"'
            if k == 'uptake' else 'As C%d' % first_km)
    rows.append('| C%d | %s | `ACT3_KM.%s` | %s | %s, applied to whichever substrate is limiting | %s | V14 stage 4 |'
                % (n, v, k, real, v, KWHY[k]))
    n += 1
for name in ORDER:
    m = re.search(r'export const %s = ([0-9*\s]+);' % name, t)
    val = m.group(1).strip()
    real, why = SWHY[name]
    rows.append('| C%d | %s | `%s` | %s | %s | %s | V14 stage 4 |' % (n, val, name, real, val, why))
    n += 1

io.open('scratch_rows.md', 'w', encoding='utf-8').write('\n'.join(rows) + '\n')
print('rows %d, ids C26 to C%d, first km id C%d' % (len(rows), n - 1, first_km))
