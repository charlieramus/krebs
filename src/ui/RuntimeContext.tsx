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
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  createActRuntime,
  type ActRuntime,
  type ActRuntimeOptions,
  type ActSnapshot,
} from './runtime';

const RuntimeContext = createContext<ActRuntime | null>(null);

export function RuntimeProvider({
  children,
  options,
}: {
  children: ReactNode;
  options?: ActRuntimeOptions;
}) {
  // Lazy initialiser, so StrictMode's double render does not build two
  // simulations and throw one away mid-flight.
  const [runtime] = useState(() => createActRuntime(options ?? {}));

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
