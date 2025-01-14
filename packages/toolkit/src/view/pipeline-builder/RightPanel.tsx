import { useShallow } from "zustand/react/shallow";
import { Button, Icons, Separator } from "@instill-ai/design-system";
import { InstillStore, useInstillStore } from "../../lib";
import { ComponentFormOnRightPanel } from "./components/ComponentFormOnRightPanel";

const selector = (store: InstillStore) => ({
  nodes: store.nodes,
  currentAdvancedConfigurationNodeID: store.currentAdvancedConfigurationNodeID,
  updateCurrentAdvancedConfigurationNodeID:
    store.updateCurrentAdvancedConfigurationNodeID,
});

export const RightPanel = () => {
  const {
    nodes,
    currentAdvancedConfigurationNodeID,
    updateCurrentAdvancedConfigurationNodeID,
  } = useInstillStore(useShallow(selector));

  const selectedConnectorNode = nodes.find(
    (node) => node.id === currentAdvancedConfigurationNodeID
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-6 flex w-full flex-row gap-x-1">
        <p className="flex flex-1 items-center justify-center rounded-sm bg-semantic-bg-base-bg py-2 text-semantic-fg-primary product-body-text-1-semibold">
          Connector Properties
        </p>
        <Button
          className="h-10 w-10 !px-0 !py-0"
          variant="secondaryGrey"
          size="md"
          type="button"
          onClick={() => {
            updateCurrentAdvancedConfigurationNodeID(() => null);
          }}
        >
          <Icons.X className="h-4 w-4 stroke-semantic-fg-primary" />
        </Button>
      </div>
      <div className="relative mb-6 w-full">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-semantic-bg-primary px-2">
          <p className="text-semantic-fg-secondary product-body-text-3-medium">
            Configuration
          </p>
        </div>
        <Separator orientation="horizontal" />
      </div>

      {/* 
        We use this additional pb to cope with Browser eaten up parent's padding when it is
        scrollable.
      */}

      <div className="flex w-full pb-10">
        {selectedConnectorNode &&
        selectedConnectorNode.data.nodeType === "connector" &&
        selectedConnectorNode.data.component.connector_definition ? (
          <ComponentFormOnRightPanel
            componentID={selectedConnectorNode.data.component.id}
            definition={
              selectedConnectorNode.data.component.connector_definition
            }
            configuration={selectedConnectorNode.data.component.configuration}
            nodeType="connector"
          />
        ) : null}
        {selectedConnectorNode &&
        selectedConnectorNode.data.nodeType === "operator" &&
        selectedConnectorNode.data.component.operator_definition ? (
          <ComponentFormOnRightPanel
            componentID={selectedConnectorNode.data.component.id}
            definition={
              selectedConnectorNode.data.component.operator_definition
            }
            configuration={selectedConnectorNode.data.component.configuration}
            nodeType="operator"
          />
        ) : null}
      </div>
    </div>
  );
};
