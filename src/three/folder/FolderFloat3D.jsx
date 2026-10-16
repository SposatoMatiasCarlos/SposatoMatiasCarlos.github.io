import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useCursor } from '@react-three/drei';
import { MathUtils } from 'three';
import { folderBack, pill, roundedRect } from './shapes.js';

// Versione 3D di "Folder Float" (reactbits.dev/micro/folder-float):
// una cartella che si apre al passaggio del mouse (o al tap) e da cui
// le note escono a molla, restando a fluttuare sopra di essa.
// Da usare dentro <Scene>.

// Misure in unità three.js (≈ px dell'originale / 100)
const W = 2;
const H = 1.48;
const R = 0.14;
const TAB = 0.14;
const PILL_H = 0.34;
const FONT = 0.15;
const GAP = 0.12;
const ROW = 0.52;
const LIFT = 0.12;
const TILT = MathUtils.degToRad(8);
const BACK_ANGLE = MathUtils.degToRad(-8);
const REST_ANGLE = MathUtils.degToRad(16);
const OPEN_ANGLE = MathUtils.degToRad(34);
const STAGGER = 0.045;
const CLOSE_DELAY = 150; // ms prima di chiudere quando il mouse esce

const COLORS = {
  back: '#065f46',
  front: '#059669',
  paper: '#f5f5f5',
  item: '#f5f5f5',
  itemHover: '#5f5bf2',
  ink: '#18181b',
  inkHover: '#f4f4f5',
  label: '#f5f5f5',
};

// Pseudo-casuale ma stabile, come nell'originale
const jitter = i => {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
};

// Larghezza stimata della pillola in base al testo
const pillWidth = title => 0.32 + title.length * FONT * 0.56;

// Dispone le note su righe centrate sopra la cartella (dal basso verso l'alto)
function layout(items, spread) {
  const rows = [];
  let row = [];
  let width = 0;
  items.forEach((item, i) => {
    const w = pillWidth(item.title);
    if (row.length && width + GAP + w > spread * 2) {
      rows.push({ items: row, width });
      row = [];
      width = 0;
    }
    row.push({ i, w });
    width += (row.length > 1 ? GAP : 0) + w;
  });
  if (row.length) rows.push({ items: row, width });

  const pos = [];
  rows.forEach((r, ri) => {
    let x = -r.width / 2;
    const shift = (ri % 2 ? 1 : -1) * Math.min(0.16, spread * 0.1);
    r.items.forEach(({ i, w }) => {
      const j = jitter(i);
      pos[i] = {
        w,
        x: x + w / 2 + shift + (j - 0.5) * 0.06,
        y: H + TAB + LIFT + PILL_H / 2 + ri * ROW + j * 0.06,
        r: TILT * (j * 2 - 1),
      };
      x += w + GAP;
    });
  });
  return { pos, rows: rows.length };
}

// Molla smorzata: con poco smorzamento supera il bersaglio e rimbalza
function stepSpring(s, target, delta, damping) {
  const k = 180;
  const dt = Math.min(delta, 1 / 30) / 2;
  for (let n = 0; n < 2; n++) {
    s.v += (k * (target - s.x) - damping * s.v) * dt;
    s.x += s.v * dt;
  }
}

function Note({ item, index, count, target, state, reduce, onSelect, setHovering }) {
  const group = useRef();
  const spring = useRef({ x: 0, v: 0 });
  const [hovered, setHovered] = useState(false);
  const geometry = useMemo(() => pill(target.w, PILL_H), [target.w]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }, delta) => {
    const g = group.current;
    const { open, changedAt } = state.current;
    const elapsed = clock.elapsedTime - changedAt;
    // Apertura in ordine, chiusura in ordine inverso e più rapida
    const delay = open ? index * STAGGER : (count - 1 - index) * STAGGER * 0.5;
    const started = elapsed > delay;
    const goal = open === started ? 1 : 0;
    const s = spring.current;
    if (reduce) {
      s.x = goal;
      s.v = 0;
    } else {
      stepSpring(s, goal, delta, open ? 12 : 27);
    }
    const p = s.x;

    // Nascosta quando è dentro la cartella
    g.visible = p > 0.01 || goal > 0;

    // Parte da dentro la cartella (dietro il fronte) e sale nella posizione finale
    const drift = reduce ? 0 : Math.sin(clock.elapsedTime * 2 + index * 1.7) * 0.03 * p;
    g.position.set(
      MathUtils.lerp(target.x * 0.15, target.x, p),
      MathUtils.lerp(H * 0.45, target.y, p) + drift,
      MathUtils.lerp(0.06, 0.35, p),
    );
    g.rotation.z = target.r * p;
    g.rotation.y = reduce ? 0 : Math.sin(clock.elapsedTime * 0.9 + index) * 0.12 * p;
    const hoverScale = MathUtils.damp(g.userData.hover ?? 1, hovered ? 1.06 : 1, 12, delta);
    g.userData.hover = hoverScale;
    g.scale.setScalar(MathUtils.lerp(0.6, 1, Math.min(Math.max(p, 0), 1.2)) * hoverScale);
  });

  return (
    <group ref={group} visible={false}>
      <mesh
        geometry={geometry}
        onPointerOver={e => {
          e.stopPropagation();
          setHovered(true);
          setHovering(true);
        }}
        onPointerOut={() => {
          setHovered(false);
          setHovering(false);
        }}
        onClick={e => {
          e.stopPropagation();
          if (state.current.open) onSelect(item.page);
        }}
      >
        <meshStandardMaterial color={hovered ? COLORS.itemHover : COLORS.item} roughness={0.45} />
      </mesh>
      <Text
        position={[0, 0, 0.03]}
        fontSize={FONT}
        color={hovered ? COLORS.inkHover : COLORS.ink}
        anchorX="center"
        anchorY="middle"
      >
        {item.title}
      </Text>
    </group>
  );
}

function FolderFloat3D({ items, label = 'Progetti', sublabel, onSelect }) {
  const viewport = useThree(s => s.viewport);
  const [open, setOpenState] = useState(false);
  const [hovering, setHovering] = useState(false);
  const state = useRef({ open: false, changedAt: 0 });
  const closeTimer = useRef();
  const root = useRef();
  const front = useRef();
  const paper = useRef();
  const clock = useThree(s => s.clock);
  useCursor(hovering);

  const reduce = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  // Su schermi stretti rimpicciolisce tutto e stringe le righe di note
  const scale = Math.min(1, viewport.width / 4.6);
  const spread = Math.min(1.9, (viewport.width / scale) / 2 - 0.3);
  const { pos, rows } = useMemo(() => layout(items, spread), [items, spread]);
  const sub = sublabel ?? `${items.length} ${items.length === 1 ? 'progetto' : 'progetti'}`;

  const backGeo = useMemo(() => folderBack(W, H, R, TAB), []);
  const frontGeo = useMemo(() => roundedRect(W, H * 0.76, R), []);
  useEffect(
    () => () => {
      backGeo.dispose();
      frontGeo.dispose();
      clearTimeout(closeTimer.current);
    },
    [backGeo, frontGeo],
  );

  const setOpen = next => {
    clearTimeout(closeTimer.current);
    if (state.current.open === next) return;
    state.current = { open: next, changedAt: clock.elapsedTime };
    setOpenState(next);
  };
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  useFrame(({ pointer }, delta) => {
    // Il fronte si piega in avanti, il foglio sale
    const isOpen = state.current.open;
    const k = reduce ? 1000 : 9;
    front.current.rotation.x = MathUtils.damp(front.current.rotation.x, isOpen ? OPEN_ANGLE : REST_ANGLE, k, delta);
    paper.current.position.y = MathUtils.damp(paper.current.position.y, isOpen ? H * 0.65 : H * 0.45, k, delta);
    // Leggera inclinazione verso il puntatore per dare profondità
    if (!reduce) {
      root.current.rotation.y = MathUtils.damp(root.current.rotation.y, pointer.x * 0.25, 4, delta);
      root.current.rotation.x = MathUtils.damp(root.current.rotation.x, -pointer.y * 0.12, 4, delta);
    }
  });

  // Solo il mouse apre col passaggio; col touch si usa il tap
  const hoverHandlers = {
    onPointerOver: e => {
      if (e.nativeEvent.pointerType !== 'mouse') return;
      setOpen(true);
    },
    onPointerOut: e => {
      if (e.nativeEvent.pointerType !== 'mouse') return;
      scheduleClose();
    },
  };

  const zoneTop = H + TAB + LIFT + rows * ROW + 0.2;

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 4, 5]} intensity={2.2} />
      <directionalLight position={[-3, 1, 2]} intensity={0.5} />

      <group position={[0, -1.2 * scale, 0]} scale={scale}>
        <group ref={root} {...hoverHandlers} onPointerMissed={() => setOpen(false)}>
          {/* Zona invisibile sopra la cartella: tiene aperto mentre il mouse va verso le note */}
          {open && (
            <mesh position={[0, (H + zoneTop) / 2, 0.3]}>
              <planeGeometry args={[spread * 2 + 0.4, zoneTop - H]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}

          <group
            onClick={e => {
              e.stopPropagation();
              setOpen(!state.current.open);
            }}
            onPointerOver={() => setHovering(true)}
            onPointerOut={() => setHovering(false)}
          >
            <mesh geometry={backGeo} rotation-x={BACK_ANGLE}>
              <meshStandardMaterial color={COLORS.back} roughness={0.7} />
            </mesh>

            <mesh ref={paper} position={[0, H * 0.45, 0.06]} rotation-x={BACK_ANGLE}>
              <boxGeometry args={[W * 0.84, H * 0.5, 0.01]} />
              <meshStandardMaterial color={COLORS.paper} roughness={0.9} />
            </mesh>

            <group ref={front} position-z={0.14} rotation-x={REST_ANGLE}>
              <mesh geometry={frontGeo}>
                <meshStandardMaterial color={COLORS.front} roughness={0.55} />
              </mesh>
              <Text
                position={[-W / 2 + 0.16, 0.36, 0.045]}
                fontSize={0.13}
                color={COLORS.label}
                anchorX="left"
                anchorY="bottom"
              >
                {label}
              </Text>
              <Text
                position={[-W / 2 + 0.16, 0.16, 0.045]}
                fontSize={0.11}
                color={COLORS.label}
                fillOpacity={0.55}
                anchorX="left"
                anchorY="bottom"
              >
                {sub}
              </Text>
            </group>
          </group>

          {items.map((item, i) => (
            <Note
              key={item.page}
              item={item}
              index={i}
              count={items.length}
              target={pos[i]}
              state={state}
              reduce={reduce}
              onSelect={onSelect}
              setHovering={setHovering}
            />
          ))}
        </group>
      </group>
    </>
  );
}

export default FolderFloat3D;
