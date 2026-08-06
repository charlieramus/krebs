/**
 * The React side of the bridge, and the whole of it.
 *
 * REACT NEVER RE-RENDERS AT TICK RATE. `useLive` subscribes a DOM node to the
 * snapshot and writes its text content directly. No state is set, so no
 * reconciliation happens, so a screen showing forty moving numbers costs forty
 * string writes per frame rather than a tree diff. React state is reserved for
 * discrete events: an unlock bought, a stall detected, a coach mark opened.
 *
 * The runtime is created once and held in state rather than in a module
 * singleton, so a test can mount two of them and a StrictMode double-mount does
 * not build two simulations.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { ACT1, type ActDescriptor } from '../content/acts';
import {
  createActRuntime,
  type ActRuntime,
  type ActRuntimeOptions,
  type ActSnapshot,
} from './runtime';

const RuntimeContext = createContext<ActRuntime | null>(null);

export function RuntimeProvider({
  children,
  act = ACT1,
  options,
}: {
  children: ReactNode;
  /**
   * The act to run. Defaults to act 1 because act 1 is the only act, and the
   * default is here rather than inside the runtime on purpose: `createActRuntime`
   * takes the descriptor as a required argument, so nothing below this line can
   * fall back to act 1 by accident. Stage 5 makes `App` choose it from the save.
   */
  act?: ActDescriptor;
  options?: ActRuntimeOptions;
}) {
  // Lazy initialiser, so StrictMode's double render does not build two
  // simulations and throw one away mid-flight.
  const [runtime] = useState(() => createActRuntime(act, options ?? {}));

  useEffect(() => {
    runtime.start();
    return () => runtime.stop();
  }, [runtime]);

  return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>;
}

export function useRuntime(): ActRuntime {
  const runtime = useContext(RuntimeContext);
  if (runtime === null) throw new Error('useRuntime: no RuntimeProvider above this component');
  return runtime;
}

/** The running act. What used to be an assumption every component made. */
export function useAct(): ActDescriptor {
  return useRuntime().act;
}

/**
 * A pool's index, resolved once per component instance and never per render.
 *
 * THE RULE THIS EXISTS FOR. `src/sim/steady.ts` states it for the kernel: no
 * allocation after construction, indexed loops over typed arrays only. The
 * interface never held it. `poolIndex` was a linear scan over `ACT1_POOL_IDS`
 * and `PoolCard` called it inside its render body, so every pool card paid a
 * scan on every React render, and nothing in the suite could have found it
 * because every test asserts a value rather than the shape of the work that
 * produced it.
 *
 * `useMemo` with the act as its only dependency is the whole fix: one map read
 * at mount, an integer afterwards. The dependency is the act rather than the id
 * because an id is a literal at every call site in this codebase, and keying on
 * it would suggest a component whose pool changes under it, which none do.
 */
export function usePoolIndex(id: string): number {
  const act = useAct();
  return useMemo(() => act.poolIndex(id), [act, id]);
}

/** A reaction's index, on the same terms. */
export function useReactionIndex(id: string): number {
  const act = useAct();
  return useMemo(() => act.reactionIndex(id), [act, id]);
}

/**
 * Bind a DOM node to the snapshot, updated every frame with no render.
 *
 * The general form. `apply` gets the element and the snapshot and may write
 * anything: text, a fill, a class, a transform. It must not set React state, and
 * it must not write to simulation state, which it has no reference to anyway.
 *
 * The callback is held in a ref so that an inline arrow at the call site does
 * not resubscribe on every render. The subscription is keyed to the runtime.
 */
export function useLiveNode<E extends HTMLElement | SVGElement>(
  apply: (element: E, snapshot: ActSnapshot) => void,
): RefObject<E | null> {
  const runtime = useRuntime();
  const ref = useRef<E>(null);
  const applyRef = useRef(apply);

  useEffect(() => {
    applyRef.current = apply;
  });

  useEffect(
    () =>
      runtime.subscribe((snapshot) => {
        const element = ref.current;
        if (element === null) return;
        applyRef.current(element, snapshot);
      }),
    [runtime],
  );

  return ref;
}

/**
 * Subscribe to the snapshot without a DOM node.
 *
 * For the rare thing that watches simulation state in order to change React
 * state: a purchase becoming affordable, a stall beginning. The callback runs
 * every frame, so it must compare before it sets, or it re-renders the tree
 * sixty times a second and undoes the entire point of the runtime.
 */
export function useSnapshotEffect(effect: (snapshot: ActSnapshot) => void): void {
  const runtime = useRuntime();
  const effectRef = useRef(effect);

  useEffect(() => {
    effectRef.current = effect;
  });

  useEffect(() => runtime.subscribe((snapshot) => effectRef.current(snapshot)), [runtime]);
}

/**
 * Bind a DOM node's text content to the snapshot. The common case.
 *
 * Comparing before writing is not a micro-optimisation. Setting textContent
 * unconditionally invalidates layout for that node every frame even when the
 * string did not change, and most of these strings do not change on most frames,
 * because the simulation ticks at 20Hz and the display runs at 60.
 */
export function useLive<E extends HTMLElement | SVGElement>(
  read: (snapshot: ActSnapshot) => string,
): RefObject<E | null> {
  return useLiveNode<E>((element, snapshot) => {
    const next = read(snapshot);
    if (element.textContent !== next) element.textContent = next;
  });
}
