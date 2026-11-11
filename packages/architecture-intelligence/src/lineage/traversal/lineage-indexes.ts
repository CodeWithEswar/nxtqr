/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Lineage Graph Indexes for O(1) Adjacency & Metadata Lookups
 */

import type {
  ArchitectureDataLineageModel,
  DataAsset,
  DataFlow,
  DataTransformation,
  StorageBinding,
} from "../contracts/lineage.types";

export class LineageIndexes {
  public readonly assetById = new Map<string, DataAsset>();
  public readonly flowsByAsset = new Map<string, DataFlow[]>();
  public readonly flowsBySource = new Map<string, DataFlow[]>();
  public readonly flowsByDestination = new Map<string, DataFlow[]>();
  public readonly transformationsByInput = new Map<string, DataTransformation[]>();
  public readonly transformationsByOutput = new Map<string, DataTransformation[]>();
  public readonly transformationsByComponent = new Map<string, DataTransformation[]>();
  public readonly storageByAsset = new Map<string, StorageBinding[]>();
  public readonly storageByComponent = new Map<string, { asset: DataAsset; storage: StorageBinding }[]>();

  constructor(model: ArchitectureDataLineageModel) {
    this.buildIndexes(model);
  }

  private buildIndexes(model: ArchitectureDataLineageModel): void {
    // 1. Index Assets
    for (const asset of model.assets) {
      this.assetById.set(asset.id, asset);
      this.storageByAsset.set(asset.id, asset.storageBindings);

      for (const storage of asset.storageBindings) {
        const list = this.storageByComponent.get(storage.componentId) || [];
        list.push({ asset, storage });
        this.storageByComponent.set(storage.componentId, list);
      }
    }

    // 2. Index Flows
    for (const flow of model.flows) {
      // By source
      const srcList = this.flowsBySource.get(flow.sourceComponentId) || [];
      srcList.push(flow);
      this.flowsBySource.set(flow.sourceComponentId, srcList);

      // By destination
      const dstList = this.flowsByDestination.get(flow.destinationComponentId) || [];
      dstList.push(flow);
      this.flowsByDestination.set(flow.destinationComponentId, dstList);

      // By asset
      for (const assetId of flow.dataAssetIds) {
        const assetFlows = this.flowsByAsset.get(assetId) || [];
        assetFlows.push(flow);
        this.flowsByAsset.set(assetId, assetFlows);
      }
    }

    // 3. Index Transformations
    for (const trans of model.transformations) {
      for (const inId of trans.inputAssetIds) {
        const list = this.transformationsByInput.get(inId) || [];
        list.push(trans);
        this.transformationsByInput.set(inId, list);
      }

      for (const outId of trans.outputAssetIds) {
        const list = this.transformationsByOutput.get(outId) || [];
        list.push(trans);
        this.transformationsByOutput.set(outId, list);
      }

      const compList = this.transformationsByComponent.get(trans.componentId) || [];
      compList.push(trans);
      this.transformationsByComponent.set(trans.componentId, compList);
    }
  }

  public getAsset(id: string): DataAsset | undefined {
    return this.assetById.get(id);
  }
}

export { LineageIndexes as LineageIndexStore };
