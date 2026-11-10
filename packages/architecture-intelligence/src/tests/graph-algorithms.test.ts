import { describe, it, expect } from "vitest";
import { computeReachability, hasPath } from "../algorithms/reachability";
import { computeStronglyConnectedComponents } from "../algorithms/cycles";
import { findArticulationPoints } from "../algorithms/articulation-points";
import { findLongestPaths } from "../algorithms/critical-paths";
import { extractBoundaries, findTrustBoundaryCrossings } from "../algorithms/failure-domains";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

describe("Graph Algorithms", () => {
  describe("Reachability", () => {
    it("computes reachable nodes and shortest distances via BFS", () => {
      const adj = new Map<string, string[]>([
        ["A", ["B", "C"]],
        ["B", ["D"]],
        ["C", []],
        ["D", ["E"]],
        ["E", []],
      ]);

      const result = computeReachability(["A"], adj);
      expect(result.reachableNodes.has("A")).toBe(true);
      expect(result.reachableNodes.has("E")).toBe(true);
      expect(result.distances.get("E")).toBe(3);
      expect(hasPath("A", "E", adj)).toBe(true);
      expect(hasPath("C", "E", adj)).toBe(false);
    });
  });

  describe("Cycle Detection (Tarjan SCC)", () => {
    it("detects directed cycles among services", () => {
      const adj = new Map<string, string[]>([
        ["svc1", ["svc2"]],
        ["svc2", ["svc3"]],
        ["svc3", ["svc1"]], // Cycle svc1 -> svc2 -> svc3 -> svc1
        ["svc4", []],
      ]);

      const result = computeStronglyConnectedComponents(["svc1", "svc2", "svc3", "svc4"], adj);
      expect(result.cycles.length).toBe(1);
      expect(result.cycles[0]).toContain("svc1");
      expect(result.cycles[0]).toContain("svc2");
      expect(result.cycles[0]).toContain("svc3");
    });

    it("returns zero cycles for DAG", () => {
      const adj = new Map<string, string[]>([
        ["A", ["B"]],
        ["B", ["C"]],
        ["C", []],
      ]);
      const result = computeStronglyConnectedComponents(["A", "B", "C"], adj);
      expect(result.cycles.length).toBe(0);
    });
  });

  describe("Articulation Points (SPOF Detection)", () => {
    it("identifies bridge nodes whose removal isolates components", () => {
      // Topology: A - B - C. If B is removed, A and C are disconnected.
      const undirected = new Map<string, string[]>([
        ["A", ["B"]],
        ["B", ["A", "C"]],
        ["C", ["B"]],
      ]);

      const result = findArticulationPoints(["A", "B", "C"], undirected);
      expect(result.articulationPoints.has("B")).toBe(true);
      expect(result.articulationPoints.has("A")).toBe(false);
      expect(result.articulationPoints.has("C")).toBe(false);
    });

    it("does not report articulation points on a biconnected ring", () => {
      // Ring: A - B - C - D - A. No single node removal disconnects the ring.
      const undirected = new Map<string, string[]>([
        ["A", ["B", "D"]],
        ["B", ["A", "C"]],
        ["C", ["B", "D"]],
        ["D", ["C", "A"]],
      ]);

      const result = findArticulationPoints(["A", "B", "C", "D"], undirected);
      expect(result.articulationPoints.size).toBe(0);
    });
  });

  describe("Critical Synchronous Paths", () => {
    it("computes the longest chain depth and latency", () => {
      const adj = new Map([
        [
          "client",
          [{ targetId: "gateway", isSynchronous: true, latencyMs: 10 }],
        ],
        [
          "gateway",
          [{ targetId: "auth", isSynchronous: true, latencyMs: 25 }],
        ],
        [
          "auth",
          [{ targetId: "db", isSynchronous: true, latencyMs: 50 }],
        ],
        ["db", []],
      ]);

      const paths = findLongestPaths(["client"], adj);
      expect(paths.length).toBeGreaterThan(0);
      expect(paths[0].depth).toBe(4);
      expect(paths[0].totalEstimatedLatencyMs).toBe(85);
      expect(paths[0].isSynchronous).toBe(true);
    });
  });

  describe("Failure Domains & Boundaries", () => {
    it("extracts boundaries and identifies trust boundary crossings", () => {
      const nodes: BaseNode[] = [
        {
          id: "trust_vpc",
          type: "trust-boundary",
          position: { x: 0, y: 0 },
          data: { containedNodeIds: ["internal_api", "primary_db"] },
        },
        {
          id: "public_client",
          type: "web-browser",
          position: { x: -100, y: 0 },
          data: {},
        },
        {
          id: "internal_api",
          type: "container-service",
          position: { x: 50, y: 0 },
          data: {},
        },
      ];

      const edges: BaseEdge[] = [
        {
          id: "edge_ingress",
          source: "public_client",
          target: "internal_api",
          data: { authenticated: false },
        },
      ];

      const boundaries = extractBoundaries(nodes);
      expect(boundaries.length).toBe(1);
      expect(boundaries[0].kind).toBe("trust");

      const crossings = findTrustBoundaryCrossings(edges, boundaries);
      expect(crossings.length).toBe(1);
      expect(crossings[0].targetBoundaryId).toBe("trust_vpc");
      expect(crossings[0].sourceNodeId).toBe("public_client");
    });
  });
});

