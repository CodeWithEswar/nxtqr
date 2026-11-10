import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  DATA_ENGINEERING_AND_ANALYTICS_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_DATA_SLUGS = [
  "etl-pipeline",
  "elt-pipeline",
  "data-lake",
  "data-lakehouse",
  "data-pipeline",
  "data-ingestion-service",
  "analytics-engine",
  "olap-engine",
  "cdc-connector",
  "workflow-orchestrator",
] as const;

describe("Phase 05.1.13 — Data Engineering & Analytics Infrastructure Library", () => {
  beforeEach(() => {
    useGraphEditorStore.setState({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      canUndo: false,
      canRedo: false,
    });
  });

  describe("1. Registry & Category Inventory", () => {
    it("registers the canonical category 'data-engineering-and-analytics'", () => {
      const category = infrastructureRegistry.getCategory(
        DATA_ENGINEERING_AND_ANALYTICS_CATEGORY_ID
      );
      expect(category).toBeDefined();
      expect(category?.name).toBe("Data Engineering & Analytics");
      expect(category?.order).toBe(13);
    });

    it("registers exactly the 10 required Data Engineering & Analytics component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(
        DATA_ENGINEERING_AND_ANALYTICS_CATEGORY_ID
      );
      expect(components.length).toBe(10);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_DATA_SLUGS].sort());
    });

    it("ensures every Data Engineering & Analytics component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_DATA_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Default Configuration & Zod Schemas", () => {
    it("validates all 10 components against their respective Zod config schemas", () => {
      for (const slug of EXPECTED_DATA_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def, `Component definition for ${slug} must exist`).toBeDefined();
        if (!def) continue;

        const parseResult = def.configSchema.safeParse(def.defaultConfig);
        expect(
          parseResult.success,
          `Default config for ${slug} failed validation: ${
            !parseResult.success ? JSON.stringify(parseResult.error) : ""
          }`
        ).toBe(true);
      }
    });

    it("ensures no plaintext credentials or sensitive keys exist in default configs", () => {
      for (const slug of EXPECTED_DATA_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        const serialized = JSON.stringify(def.defaultConfig).toLowerCase();
        expect(serialized).not.toContain("rawpassword");
        expect(serialized).not.toContain("apikeysecret");
        expect(serialized).not.toContain("privatekey");
        expect(serialized).not.toContain("bearer eyj");
      }
    });
  });

  describe("3. Data-Flow Connection Semantics & Port Topology", () => {
    it("defines data-flow-accurate input and output ports for every data component", () => {
      for (const slug of EXPECTED_DATA_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        expect(def.ports.length).toBeGreaterThanOrEqual(2);

        const hasInput = def.ports.some((p) => p.type === "input");
        const hasOutput = def.ports.some((p) => p.type === "output");
        expect(hasInput, `${slug} must declare at least one input port`).toBe(true);
        expect(hasOutput, `${slug} must declare at least one output port`).toBe(true);

        for (const port of def.ports) {
          expect(port.dataType).toBeTruthy();
          expect(port.capacity).toBeGreaterThan(0);
        }
      }
    });

    it("distinguishes ETL and ELT port semantics and transformation ordering", () => {
      const etl = infrastructureRegistry.getComponent("etl-pipeline");
      expect(etl).toBeDefined();
      const etlPortTypes = etl?.ports.map((p) => p.dataType);
      expect(etlPortTypes).toContain("Dataset_Batch_In");
      expect(etlPortTypes).toContain("Transformed_Batch_Out");
      expect(etlPortTypes).toContain("Quarantined_Record_Stream");

      const elt = infrastructureRegistry.getComponent("elt-pipeline");
      expect(elt).toBeDefined();
      const eltPortTypes = elt?.ports.map((p) => p.dataType);
      expect(eltPortTypes).toContain("Raw_Ingest_Stream");
      expect(eltPortTypes).toContain("Curated_Table_Model");
      expect(eltPortTypes).toContain("Transformation_Audit_Metrics");
    });

    it("validates specific port types for lakehouse, analytics, CDC, and orchestrator nodes", () => {
      const lakehouse = infrastructureRegistry.getComponent("data-lakehouse");
      expect(lakehouse).toBeDefined();
      const lhPortTypes = lakehouse?.ports.map((p) => p.dataType);
      expect(lhPortTypes).toContain("ACID_Table_Commit");
      expect(lhPortTypes).toContain("Columnar_Scan_Stream");
      expect(lhPortTypes).toContain("Snapshot_Time_Travel_Stream");

      const cdc = infrastructureRegistry.getComponent("cdc-connector");
      expect(cdc).toBeDefined();
      const cdcPortTypes = cdc?.ports.map((p) => p.dataType);
      expect(cdcPortTypes).toContain("Database_WAL_Stream");
      expect(cdcPortTypes).toContain("CDC_Change_Event");
      expect(cdcPortTypes).toContain("Schema_Evolution_Notice");

      const analytics = infrastructureRegistry.getComponent("analytics-engine");
      expect(analytics).toBeDefined();
      const anaPortTypes = analytics?.ports.map((p) => p.dataType);
      expect(anaPortTypes).toContain("Analytical_Query_Request");
      expect(anaPortTypes).toContain("Analytical_Result_Set");
      expect(anaPortTypes).toContain("Query_Execution_Profile");

      const orchestrator = infrastructureRegistry.getComponent("workflow-orchestrator");
      expect(orchestrator).toBeDefined();
      const orchPortTypes = orchestrator?.ports.map((p) => p.dataType);
      expect(orchPortTypes).toContain("Workflow_Trigger_Event");
      expect(orchPortTypes).toContain("Task_State_Feedback");
      expect(orchPortTypes).toContain("Task_Execution_Command");
      expect(orchPortTypes).toContain("Workflow_Alert_Notice");
    });
  });

  describe("4. Graph Editor Store & Lifecycle Integration", () => {
    it("creates, selects, updates, and removes data engineering nodes in the store", () => {
      const store = useGraphEditorStore.getState();

      const lakehouseNode = infrastructureRegistry.createInfrastructureNode(
        "data-lakehouse",
        {
          position: { x: 300, y: 200 },
          label: "Primary Iceberg Lakehouse",
        }
      );

      store.addNode(lakehouseNode);
      expect(useGraphEditorStore.getState().nodes).toHaveLength(1);

      const validated = BaseNodeSchema.safeParse(
        useGraphEditorStore.getState().nodes[0]
      );
      expect(validated.success).toBe(true);

      store.selectNode(lakehouseNode.id, false);
      expect(useGraphEditorStore.getState().selectedNodeIds).toEqual([lakehouseNode.id]);

      store.updateNodeConfig(lakehouseNode.id, {
        data: {
          ...lakehouseNode.data,
          assumedDataVolumeTb: 120,
          compactionStrategy: "sort-z-order",
        },
      });

      const updatedNode = useGraphEditorStore.getState().nodes[0];
      expect(updatedNode.data.assumedDataVolumeTb).toBe(120);
      expect(updatedNode.data.compactionStrategy).toBe("sort-z-order");

      store.deleteNodeById(lakehouseNode.id);
      expect(useGraphEditorStore.getState().nodes).toHaveLength(0);
    });

    it("builds an end-to-end Modern Lakehouse Analytics Architecture graph topology", () => {
      const store = useGraphEditorStore.getState();

      // 1. CDC Connector (Source PostgreSQL DB)
      const cdcNode = infrastructureRegistry.createInfrastructureNode("cdc-connector", {
        position: { x: 50, y: 200 },
        label: "PostgreSQL WAL CDC",
      });

      // 2. Data Ingestion Service (Buffer & Validate)
      const ingestNode = infrastructureRegistry.createInfrastructureNode("data-ingestion-service", {
        position: { x: 280, y: 200 },
        label: "Ingestion Gateway",
      });

      // 3. Data Pipeline (Continuous Streaming Enrichment)
      const pipelineNode = infrastructureRegistry.createInfrastructureNode("data-pipeline", {
        position: { x: 520, y: 200 },
        label: "Flink Stream Pipeline",
      });

      // 4. Data Lakehouse (Apache Iceberg Storage)
      const lakehouseNode = infrastructureRegistry.createInfrastructureNode("data-lakehouse", {
        position: { x: 760, y: 200 },
        label: "Iceberg Bronze/Silver Table",
      });

      // 5. Analytics Engine (Trino MPP SQL)
      const analyticsNode = infrastructureRegistry.createInfrastructureNode("analytics-engine", {
        position: { x: 1000, y: 200 },
        label: "Trino Analytics Engine",
      });

      // 6. Workflow Orchestrator (Airflow DAG Control)
      const orchNode = infrastructureRegistry.createInfrastructureNode("workflow-orchestrator", {
        position: { x: 520, y: 50 },
        label: "Airflow Task Orchestrator",
      });

      store.addNode(cdcNode);
      store.addNode(ingestNode);
      store.addNode(pipelineNode);
      store.addNode(lakehouseNode);
      store.addNode(analyticsNode);
      store.addNode(orchNode);

      expect(useGraphEditorStore.getState().nodes).toHaveLength(6);

      // Connect Pipeline Edges
      store.addEdge({
        id: "edge-cdc-ingest",
        source: cdcNode.id,
        target: ingestNode.id,
        sourceHandle: "change-event-out",
        targetHandle: "ingress-stream-in",
        data: {},
      });

      store.addEdge({
        id: "edge-ingest-pipeline",
        source: ingestNode.id,
        target: pipelineNode.id,
        sourceHandle: "buffered-egress-out",
        targetHandle: "pipeline-data-in",
        data: {},
      });

      store.addEdge({
        id: "edge-pipeline-lakehouse",
        source: pipelineNode.id,
        target: lakehouseNode.id,
        sourceHandle: "processed-data-out",
        targetHandle: "table-commit-in",
        data: {},
      });

      store.addEdge({
        id: "edge-lakehouse-analytics",
        source: lakehouseNode.id,
        target: analyticsNode.id,
        sourceHandle: "columnar-scan-out",
        targetHandle: "table-scan-in",
        data: {},
      });

      store.addEdge({
        id: "edge-orch-pipeline",
        source: orchNode.id,
        target: pipelineNode.id,
        sourceHandle: "task-dispatch-out",
        targetHandle: "pipeline-data-in",
        data: {},
      });

      expect(useGraphEditorStore.getState().edges).toHaveLength(5);
    });
  });
});
