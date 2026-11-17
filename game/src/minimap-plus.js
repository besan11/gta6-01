// minimap-plus.js — The minimap's extras: the dashed green route from Dario
// to his objective, the objective marker that breathes with game time, and
// the police dots. The pulse radius is a function of G.time alone, so the
// minimap is identical on every deterministic run.
import { PALETTE } from './config.js';

export function pulseRadius(time) {
  return 7 + Math.sin(time * 3) * 2.5;
}

export function objectivePoint(G) {
  const step = G.missions ? currentStepOf(G) : null;
  if (!step) return null;
  return { x: step.x, y: step.y };
}

function currentStepOf(G) {
  const m = G.missions;
  if (!m) return null;
  const mission = missionAt(m.index);
  return mission ? mission.steps[m.step] : null;
}

function missionAt(index) {
  return missionList[index] || null;
}

// Filled in by minimap.js through setMissionList so this module stays free
// of the mission data import cycle.
export let missionList = [];
export function setMissionList(list) {
  missionList = list;
}

export function drawRoute(ctx, G, toScreen) {
  const p = G.player;
  const obj = objectivePoint(G);
  if (!obj) return;
  const a = toScreen(p.x, p.y);
  const b = toScreen(obj.x, obj.y);
  ctx.save();
  ctx.strokeStyle = PALETTE.objective;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
  const pr = pulseRadius(G.time);
  ctx.strokeStyle = PALETTE.marker;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, pr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = PALETTE.marker;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
  ctx.fill();
}
