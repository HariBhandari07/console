import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from "reactflow";
import { Nullable } from "../type";

import { NodeData } from "../../view";
import { TriggerUserPipelineResponse } from "../vdp-sdk/pipeline";
import { StateCreator } from "zustand";
import {
  InstillStore,
  InstillStoreMutators,
  PipelineBuilderCreateResourceDialogState,
  PipelineBuilderSlice,
  PipelineBuilderState,
} from "./types";
import { InstillJSONSchema } from "../use-instill-form";

export const pipelineBuilderInitialState: PipelineBuilderState = {
  pipelineId: null,
  pipelineName: null,
  pipelineUid: null,
  pipelineDescription: null,
  nodes: [],
  edges: [],
  isSavingPipeline: false,
  rightPanelIsOpen: false,
  pipelineRecipeIsDirty: false,
  pipelineIsNew: false,
  selectedConnectorNodeId: null,
  connectorFormIsDirty: false,
  selectResourceDialogIsOpen: false,
  currentAdvancedConfigurationNodeID: null,
  expandAllNodes: false,
  testModeEnabled: false,
  testModeTriggerResponse: null,
  pipelineOpenAPIOutputSchema: null,
  createResourceDialogState: {
    open: false,
    connectorType: null,
    connectorDefinition: null,
    onCreated: null,
    onSelectedExistingResource: null,
  },
  currentVersion: null,
  initializedByTemplateOrClone: false,
  isOwner: false,
  isTriggeringPipeline: false,
  dialogPublishPipelineIsOpen: false,
  dialogSharePipelineIsOpen: false,
  pipelineIsReadOnly: false,
};

export const createPipelineBuilderSlice: StateCreator<
  InstillStore,
  InstillStoreMutators,
  [],
  PipelineBuilderSlice
> = (set, get) => ({
  ...pipelineBuilderInitialState,
  initPipelineBuilder: () => set(() => pipelineBuilderInitialState),
  setPipelineId: (pipelineId: Nullable<string>) =>
    set((state) => {
      return { ...state, pipelineId };
    }),
  setPipelineUid: (pipelineUid: Nullable<string>) =>
    set((state) => {
      return { ...state, pipelineUid };
    }),
  setPipelineName: (pipelineName: Nullable<string>) =>
    set((state) => {
      return { ...state, pipelineName };
    }),
  setPipelineDescription: (pipelineDescription: Nullable<string>) =>
    set((state) => {
      return { ...state, pipelineDescription };
    }),
  updateRightPanelIsOpen: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return { ...state, rightPanelIsOpen: fn(state.rightPanelIsOpen) };
    }),
  updateNodes: (fn: (prev: Node<NodeData>[]) => Node<NodeData>[]) =>
    set((state) => {
      return {
        ...state,
        nodes: fn(state.nodes),
      };
    }),
  updateEdges: (fn: (prev: Edge[]) => Edge[]) =>
    set((state) => {
      return {
        ...state,
        edges: fn(state.edges),
      };
    }),
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(
        { ...connection, animated: false, type: "customEdge" },
        get().edges
      ),
    });
  },
  updatePipelineRecipeIsDirty: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return {
        ...state,
        pipelineRecipeIsDirty: fn(state.pipelineRecipeIsDirty),
      };
    }),
  updatePipelineIsNew: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return {
        ...state,
        pipelineIsNew: fn(state.pipelineIsNew),
      };
    }),
  updateIsSavingPipeline: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return {
        ...state,
        isSavingPipeline: fn(state.isSavingPipeline),
      };
    }),
  updateSelectedConnectorNodeId: (
    fn: (prev: Nullable<string>) => Nullable<string>
  ) =>
    set((state) => {
      return {
        ...state,
        selectedConnectorNodeId: fn(state.selectedConnectorNodeId),
      };
    }),
  updateCurrentAdvancedConfigurationNodeID: (
    fn: (prev: Nullable<string>) => Nullable<string>
  ) =>
    set((state) => {
      return {
        ...state,
        currentAdvancedConfigurationNodeID: fn(
          state.currentAdvancedConfigurationNodeID
        ),
      };
    }),
  updateConnectorFormIsDirty: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return {
        ...state,
        connectorFormIsDirty: fn(state.connectorFormIsDirty),
      };
    }),
  updateSelectResourceDialogIsOpen: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return {
        ...state,
        selectResourceDialogIsOpen: fn(state.selectResourceDialogIsOpen),
      };
    }),
  updateExpandAllNodes: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return {
        ...state,
        expandAllNodes: fn(state.expandAllNodes),
      };
    }),
  updateTestModeEnabled: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return {
        ...state,
        testModeEnabled: fn(state.testModeEnabled),
      };
    }),
  updateTestModeTriggerResponse: (
    fn: (
      prev: Nullable<TriggerUserPipelineResponse>
    ) => Nullable<TriggerUserPipelineResponse>
  ) =>
    set((state) => {
      return {
        ...state,
        testModeTriggerResponse: fn(state.testModeTriggerResponse),
      };
    }),

  updatePipelineOpenAPIOutputSchema: (
    fn: (prev: Nullable<InstillJSONSchema>) => Nullable<InstillJSONSchema>
  ) =>
    set((state) => {
      return {
        ...state,
        pipelineOpenAPIOutputSchema: fn(state.pipelineOpenAPIOutputSchema),
      };
    }),
  updateCreateResourceDialogState: (
    fn: (
      prev: PipelineBuilderCreateResourceDialogState
    ) => PipelineBuilderCreateResourceDialogState
  ) =>
    set((state) => {
      return {
        ...state,
        createResourceDialogState: fn(state.createResourceDialogState),
      };
    }),
  updateCurrentVersion: (fn: (prev: Nullable<string>) => Nullable<string>) =>
    set((state) => {
      return {
        ...state,
        currentVersion: fn(state.currentVersion),
      };
    }),
  updateInitializedByTemplateOrClone: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return {
        ...state,
        initializedByTemplateOrClone: fn(state.initializedByTemplateOrClone),
      };
    }),
  updateIsOwner: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return {
        ...state,
        isOwner: fn(state.isOwner),
      };
    }),
  updateIsTriggeringPipeline: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return {
        ...state,
        isTriggeringPipeline: fn(state.isTriggeringPipeline),
      };
    }),
  updateDialogPublishPipelineIsOpen: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return {
        ...state,
        dialogPublishPipelineIsOpen: fn(state.dialogPublishPipelineIsOpen),
      };
    }),
  updateDialogSharePipelineIsOpen: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return {
        ...state,
        dialogSharePipelineIsOpen: fn(state.dialogSharePipelineIsOpen),
      };
    }),
  updatePipelineIsReadOnly: (fn: (prev: boolean) => boolean) =>
    set((state) => {
      return {
        ...state,
        pipelineIsReadOnly: fn(state.pipelineIsReadOnly),
      };
    }),
});
