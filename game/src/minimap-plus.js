// Porto Verde v6 — minimap extras: the route waypoints between the player and
// the active objective, and the pulse phase the minimap reads. Kept apart from
// minimap.js so the drawer stays a drawer.
import { currentStep } from './missions.js';
import { ROADS_X, ROADS_Y } from './config.js';

export function routeWaypoints(G) {
  let step = currentStep(G);
  if (step && step.x === undefined && G.missions.pickups.length > 0) {
    const pk = G.missions.pickups.find((p) => !p.taken) || G.missions.pickups[0];
    step = { x: pk.x, y: pk.y };
  }
  if (!step || step.x === undefined) return [];
  const p = G.player;
  let midX = p.x;
  let midY = p.y;
  let best = 1e9;
  for (const rx of ROADS_X) {
    const d = Math.abs(rx - step.x);
    if (d < best) { best = d; midX = rx; }
  }
  best = 1e9;
  for (const ry of ROADS_Y) {
    const d = Math.abs(ry - p.y);
    if (d < best) { best = d; midY = ry; }
  }
  return [
    { x: p.x, y: p.y },
    { x: midX, y: p.y },
    { x: midX, y: midY },
    { x: step.x, y: midY },
    { x: step.x, y: step.y },
  ];
}

export function objectivePulse(G) {
  return 6 + Math.sin(G.time * 4) * 2.5;
}
