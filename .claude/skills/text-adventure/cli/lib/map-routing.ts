// Route planning walks discovered unlocked map connections and reports frontier blockers.
import type { MapConnection, MapState } from '../types';

export type RoutePlan = {
  from: string;
  to: string;
  reachable: boolean;
  path: string[];
  blockers: string[];
  steps: number;
  travelTime: string;
  supplyCost: { rations: number; water: number };
};

function isOpenDiscovered(connection: MapConnection): boolean {
  return connection.discovered !== false && connection.locked !== true && connection.status !== 'locked';
}

function routeLabel(connection: MapConnection): string {
  return connection.id ?? `${connection.from}-${connection.to}`;
}

function addEdge(graph: Map<string, string[]>, from: string, to: string): void {
  const list = graph.get(from) ?? [];
  if (!list.includes(to)) list.push(to);
  graph.set(from, list);
}

function buildGraph(connections: MapConnection[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const connection of connections) {
    if (!isOpenDiscovered(connection)) continue;
    addEdge(graph, connection.from, connection.to);
    if (connection.bidirectional !== false) addEdge(graph, connection.to, connection.from);
  }
  return graph;
}

function findBlockers(connections: MapConnection[], visited: Set<string>, from: string, to: string): string[] {
  const blockers: string[] = [];
  for (const connection of connections) {
    const touchesVisited = visited.has(connection.from) || visited.has(connection.to);
    const touchesTarget =
      connection.from === to || connection.to === to || connection.from === from || connection.to === from;
    if (!touchesVisited && !touchesTarget) continue;
    if (connection.discovered === false) {
      blockers.push(`${routeLabel(connection)} undiscovered`);
    } else if (connection.locked || connection.status === 'locked') {
      blockers.push(`${routeLabel(connection)} locked`);
    }
  }
  return [...new Set(blockers)];
}

export function planMapRoute(mapState: MapState, from: string, to: string): RoutePlan {
  const connections = mapState.connections ?? [];
  const zoneIds = new Set((mapState.zones ?? []).map(zone => zone.id));
  if (!zoneIds.has(from) || !zoneIds.has(to)) {
    return {
      from,
      to,
      reachable: false,
      path: [],
      blockers: [`Unknown zone: ${!zoneIds.has(from) ? from : to}`],
      steps: 0,
      travelTime: 'unreachable',
      supplyCost: { rations: 0, water: 0 },
    };
  }

  if (from === to) {
    return {
      from,
      to,
      reachable: true,
      path: [from],
      blockers: [],
      steps: 0,
      travelTime: '0 steps',
      supplyCost: { rations: 0, water: 0 },
    };
  }

  const graph = buildGraph(connections);
  const visited = new Set<string>([from]);
  const previous = new Map<string, string>();
  const queue = [from];

  while (queue.length) {
    const current = queue.shift()!;
    for (const next of graph.get(current) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      previous.set(next, current);
      if (next === to) queue.length = 0;
      else queue.push(next);
    }
  }

  if (!visited.has(to)) {
    return {
      from,
      to,
      reachable: false,
      path: [],
      blockers: findBlockers(connections, visited, from, to),
      steps: 0,
      travelTime: 'unreachable',
      supplyCost: { rations: 0, water: 0 },
    };
  }

  const path = [to];
  let current = to;
  while (current !== from) {
    current = previous.get(current)!;
    path.unshift(current);
  }
  const steps = Math.max(0, path.length - 1);
  return {
    from,
    to,
    reachable: true,
    path,
    blockers: [],
    steps,
    travelTime: `${steps} ${steps === 1 ? 'step' : 'steps'}`,
    supplyCost: {
      rations: mapState.supplies ? steps : 0,
      water: mapState.supplies ? steps : 0,
    },
  };
}
