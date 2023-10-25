import * as z from "zod";
import { Button, Form } from "@instill-ai/design-system";
import { ConnectorDefinition, GeneralRecord } from "../../lib";
import { useInstillForm } from "../../lib/use-instill-form";

export type ResourceComponentFormProps = {
  disabledAll?: boolean;
  connectorDefinition: ConnectorDefinition;
  configuration: GeneralRecord;
  onSubmit: (data: any) => void;
};

export const ResourceComponentForm = ({
  configuration,
  connectorDefinition,
  onSubmit,
  disabledAll,
}: ResourceComponentFormProps) => {
  const { form, fields } = useInstillForm({
    schema: connectorDefinition.spec.component_specification,
    data: configuration,
    disabledAll,
  });

  return (
    <Form.Root {...form}>
      <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mb-10 flex w-full flex-col space-y-5">{fields}</div>
        <div className="flex w-full flex-row-reverse gap-x-4">
          <Button
            type="submit"
            variant="secondaryColour"
            size="lg"
            className="gap-x-2"
          >
            Save
          </Button>
        </div>
      </form>
    </Form.Root>
  );
};