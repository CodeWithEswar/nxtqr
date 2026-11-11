/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Cycle-Safe, Bounded Lineage Traversal Engine
 */

import type {
  ArchitectureDataLineageModel,
  DataAsset,
  DataTransformation,
  LineagePath,
  LineagePathNode,
  LineageTraversalResult,
  StorageBinding,
} from "../contracts/lineage.types";
import { LineageIndexes } from "./lineage-indexes";

export interface TraversalOptions {
  maxDepth?: number;
  maxPaths?: number;
}

export class LineageTraversal {
  private static readonly DEFAULT_MAX_DEPTH = 15;
  private static readonly DEFAULT_MAX_PATHS = 100;

  /**
   * Traverse both upstream and downstream lineage for a target data asset.
   */
  public static traverseLineage(
    assetId: string,
    model: ArchitectureDataLineageModel,
    options: TraversalOptions = {}
  ): LineageTraversalResult {
    const indexes = new LineageIndexes(model);
    const asset = indexes.assetById.get(assetId);

    if (!asset) {
      throw new Error(`DataAsset '${assetId}' not found in lineage model.`);
    }

    const maxDepth = options.maxDepth ?? this.DEFAULT_MAX_DEPTH;
    const maxPaths = options.maxPaths ?? this.DEFAULT_MAX_PATHS;

    let isCycleDetected = false;
    let truncatedDueToLimit = false;

    // 1. Downstream Traversal (From origin/ingress downstream to consumers and stores)
    const downstreamPaths: LineagePath[] = [];
    const directFlows = indexes.flowsByAsset.get(assetId) || [];

    // Find starting entrypoints (sources of flows carrying this asset)
    const entrypoints = new Set<string>();
    for (const flow of directFlows) {
      entrypoints.add(flow.sourceComponentId);
    }

    for (const entryId of entrypoints) {
      if (downstreamPaths.length >= maxPaths) {
        truncatedDueToLimit = true;
        break;
      }

      this.exploreDownstreamPaths({
        asset,
        currentComponentId: entryId,
        currentPath: [
          {
            componentId: entryId,
            componentName: entryId,
            componentType: "service",
            action: "originate",
          },
        ],
        currentEdgeIds: [],
        visitedComponentIds: new Set([entryId]),
        indexes,
        depth: 0,
        maxDepth,
        maxPaths,
        collector: downstreamPaths,
        onCycle: () => {
          isCycleDetected = true;
        },
      });
    }

    // 2. Upstream Traversal (Backwards from consumers/storage to origins)
    const upstreamPaths: LineagePath[] = [];
    const destinations = new Set<string>();
    for (const flow of directFlows) {
      destinations.add(flow.destinationComponentId);
    }

    for (const destId of destinations) {
      if (upstreamPaths.length >= maxPaths) {
        truncatedDueToLimit = true;
        break;
      }

      this.exploreUpstreamPaths({
        asset,
        currentComponentId: destId,
        currentPath: [
          {
            componentId: destId,
            componentName: destId,
            componentType: "service",
            action: "consume",
          },
        ],
        currentEdgeIds: [],
        visitedComponentIds: new Set([destId]),
        indexes,
        depth: 0,
        maxDepth,
        maxPaths,
        collector: upstreamPaths,
        onCycle: () => {
          isCycleDetected = true;
        },
      });
    }

    // 3. Aggregate participating components, storage destinations, and third parties
    const allParticipatingComponentIds = new Set<string>();
    const dataStoresReached: StorageBinding[] = [...asset.storageBindings];
    const thirdPartiesReached = new Set<string>();
    const transformationsEncountered = new Set<DataTransformation>();

    const evaluatePathMeta = (p: LineagePath) => {
      for (const node of p.nodes) {
        allParticipatingComponentIds.add(node.componentId);
      }
      for (const edgeId of p.edges) {
        const flow = model.flows.find((f) => f.id === edgeId);
        if (flow) {
          if (flow.isThirdPartyTransfer && flow.recipientOrganization) {
            thirdPartiesReached.add(flow.recipientOrganization);
          }
          if (flow.transformationIds) {
            for (const tId of flow.transformationIds) {
              const trans = model.transformations.find((t) => t.id === tId);
              if (trans) transformationsEncountered.add(trans);
            }
          }
        }
      }
    };

    for (const p of downstreamPaths) evaluatePathMeta(p);
    for (const p of upstreamPaths) evaluatePathMeta(p);

    return {
      assetId: asset.id,
      assetName: asset.name,
      classificationLevel: asset.classification.level,
      upstreamPaths,
      downstreamPaths,
      allParticipatingComponentIds: Array.from(allParticipatingComponentIds),
      dataStoresReached,
      thirdPartiesReached: Array.from(thirdPartiesReached),
      transformationsEncountered: Array.from(transformationsEncountered),
      isCycleDetected,
      truncatedDueToLimit,
    };
  }

  /**
   * Recursive bounded DFS downstream
   */
  private static exploreDownstreamPaths(params: {
    asset: DataAsset;
    currentComponentId: string;
    currentPath: LineagePathNode[];
    currentEdgeIds: string[];
    visitedComponentIds: Set<string>;
    indexes: LineageIndexes;
    depth: number;
    maxDepth: number;
    maxPaths: number;
    collector: LineagePath[];
    onCycle: () => void;
  }): void {
    const {
      asset,
      currentComponentId,
      currentPath,
      currentEdgeIds,
      visitedComponentIds,
      indexes,
      depth,
      maxDepth,
      maxPaths,
      collector,
      onCycle,
    } = params;

    if (collector.length >= maxPaths || depth >= maxDepth) return;

    // Outgoing flows for this asset or linked transformations
    const outgoing = (indexes.flowsBySource.get(currentComponentId) || []).filter(
      (f) => f.dataAssetIds.includes(asset.id)
    );

    if (outgoing.length === 0) {
      // Reached leaf sink
      collector.push({
        pathId: `path-down-${collector.length + 1}`,
        dataAssetId: asset.id,
        dataAssetName: asset.name,
        nodes: [...currentPath],
        edges: [...currentEdgeIds],
        crossesTrustBoundary: currentEdgeIds.some((e) =>
          indexes.flowsByAsset.get(asset.id)?.find((f) => f.id === e)?.crossesTrustBoundary
        ),
        crossesBorder: currentEdgeIds.some((e) => {
          const f = indexes.flowsByAsset.get(asset.id)?.find((fl) => fl.id === e);
          return f?.sourceJurisdiction && f?.destinationJurisdiction && f.sourceJurisdiction !== f.destinationJurisdiction;
        }),
        reachesThirdParty: currentEdgeIds.some((e) =>
          indexes.flowsByAsset.get(asset.id)?.find((f) => f.id === e)?.isThirdPartyTransfer
        ),
      });
      return;
    }

    for (const flow of outgoing) {
      const nextCompId = flow.destinationComponentId;

      if (visitedComponentIds.has(nextCompId)) {
        onCycle();
        collector.push({
          pathId: `path-down-${collector.length + 1}`,
          dataAssetId: asset.id,
          dataAssetName: asset.name,
          nodes: [...currentPath],
          edges: [...currentEdgeIds, flow.id],
          crossesTrustBoundary: currentEdgeIds.some((e) =>
            indexes.flowsByAsset.get(asset.id)?.find((f) => f.id === e)?.crossesTrustBoundary
          ),
          crossesBorder: false,
          reachesThirdParty: false,
        });
        continue;
      }

      const nextNode: LineagePathNode = {
        componentId: nextCompId,
        componentName: nextCompId,
        componentType: "service",
        action: flow.isThirdPartyTransfer ? "export" : "process",
      };

      const nextVisited = new Set(visitedComponentIds);
      nextVisited.add(nextCompId);

      this.exploreDownstreamPaths({
        asset,
        currentComponentId: nextCompId,
        currentPath: [...currentPath, nextNode],
        currentEdgeIds: [...currentEdgeIds, flow.id],
        visitedComponentIds: nextVisited,
        indexes,
        depth: depth + 1,
        maxDepth,
        maxPaths,
        collector,
        onCycle,
      });
    }
  }

  /**
   * Recursive bounded DFS upstream (backwards)
   */
  private static exploreUpstreamPaths(params: {
    asset: DataAsset;
    currentComponentId: string;
    currentPath: LineagePathNode[];
    currentEdgeIds: string[];
    visitedComponentIds: Set<string>;
    indexes: LineageIndexes;
    depth: number;
    maxDepth: number;
    maxPaths: number;
    collector: LineagePath[];
    onCycle: () => void;
  }): void {
    const {
      asset,
      currentComponentId,
      currentPath,
      currentEdgeIds,
      visitedComponentIds,
      indexes,
      depth,
      maxDepth,
      maxPaths,
      collector,
      onCycle,
    } = params;

    if (collector.length >= maxPaths || depth >= maxDepth) return;

    // Incoming flows
    const incoming = (indexes.flowsByDestination.get(currentComponentId) || []).filter(
      (f) => f.dataAssetIds.includes(asset.id)
    );

    if (incoming.length === 0) {
      // Reached root origin
      collector.push({
        pathId: `path-up-${collector.length + 1}`,
        dataAssetId: asset.id,
        dataAssetName: asset.name,
        nodes: [...currentPath].reverse(),
        edges: [...currentEdgeIds].reverse(),
        crossesTrustBoundary: false,
        crossesBorder: false,
        reachesThirdParty: false,
      });
      return;
    }

    for (const flow of incoming) {
      const prevCompId = flow.sourceComponentId;

      if (visitedComponentIds.has(prevCompId)) {
        onCycle();
        continue;
      }

      const prevNode: LineagePathNode = {
        componentId: prevCompId,
        componentName: prevCompId,
        componentType: "service",
        action: "originate",
      };

      const nextVisited = new Set(visitedComponentIds);
      nextVisited.add(prevCompId);

      this.exploreUpstreamPaths({
        asset,
        currentComponentId: prevCompId,
        currentPath: [...currentPath, prevNode],
        currentEdgeIds: [...currentEdgeIds, flow.id],
        visitedComponentIds: nextVisited,
        indexes,
        depth: depth + 1,
        maxDepth,
        maxPaths,
        collector,
        onCycle,
      });
    }
  }

  public static traverseAsset(
    assetId: string,
    model: ArchitectureDataLineageModel,
    options: TraversalOptions = {}
  ): LineageTraversalResult {
    return this.traverseLineage(assetId, model, options);
  }
}

export { LineageTraversal as LineageTraversalEngine };
