import { FC, useCallback, useState } from "react";
import { Formik } from "formik";
import {
  BasicProgressMessageBox,
  ProgressMessageBoxState,
} from "@instill-ai/design-system";

import { FormikFormBase, TextArea, ToggleField } from "@/components/formik";
import { PrimaryButton } from "@/components/ui";
import { Pipeline, PipelineState } from "@/lib/instill";
import { Nullable } from "@/types/general";
import { useDeletePipeline, useUpdatePipeline } from "@/services/pipeline";
import { useAmplitudeCtx } from "context/AmplitudeContext";
import { sendAmplitudeData } from "@/lib/amplitude";
import { DeleteResourceModal } from "@/components/modals";
import { useRouter } from "next/router";

export type ConfigurePipelineFormProps = {
  pipeline: Nullable<Pipeline>;
  marginBottom: Nullable<string>;
};

export type ConfigurePipelineFormValue = {
  description: Nullable<string>;
  state: Nullable<PipelineState>;
};

const ConfigurePipelineForm: FC<ConfigurePipelineFormProps> = ({
  pipeline,
  marginBottom,
}) => {
  const router = useRouter();
  const { amplitudeIsInit } = useAmplitudeCtx();

  // ###################################################################
  // #                                                                 #
  // # Handle update pipeline                                          #
  // #                                                                 #
  // ###################################################################

  const [canEdit, setCanEdit] = useState(false);

  const [messageBoxState, setMessageBoxState] =
    useState<ProgressMessageBoxState>({
      activate: false,
      message: null,
      description: null,
      status: null,
    });

  const updatePipeline = useUpdatePipeline();

  const validateForm = useCallback((values: ConfigurePipelineFormValue) => {
    const errors: Partial<ConfigurePipelineFormValue> = {};

    if (!values.description) {
      errors.description = "Required";
    }

    return errors;
  }, []);

  const handleEditButton = (
    values: ConfigurePipelineFormValue,
    submitForm: () => Promise<void>
  ) => {
    if (!canEdit) {
      setCanEdit(true);
      return;
    }

    submitForm();
  };

  const handleUpdatePipeline = useCallback(
    (values: ConfigurePipelineFormValue) => {
      if (!pipeline || !values.description) return;

      if (
        pipeline.description === values.description &&
        pipeline.state === values.state
      ) {
        setCanEdit(false);
        return;
      }

      setMessageBoxState(() => ({
        activate: true,
        status: "progressing",
        description: null,
        message: "Updating...",
      }));

      updatePipeline.mutate(
        {
          name: pipeline.name,
          description: values.description,
        },
        {
          onSuccess: () => {
            setCanEdit(false);
            setMessageBoxState(() => ({
              activate: true,
              status: "progressing",
              description: null,
              message: "Update succeeded",
            }));
          },
          onError: (error) => {
            if (error instanceof Error) {
              setMessageBoxState(() => ({
                activate: true,
                status: "error",
                description: null,
                message: error.message,
              }));
            } else {
              setMessageBoxState(() => ({
                activate: true,
                status: "error",
                description: null,
                message: "Something went wrong when update the pipeline",
              }));
            }
          },
        }
      );
    },
    [updatePipeline, pipeline]
  );

  // ###################################################################
  // #                                                                 #
  // # Handle delete pipeline                                          #
  // #                                                                 #
  // ###################################################################

  const [deletePipelineModalIsOpen, setDeletePipelineModalIsOpen] =
    useState(false);

  const deletePipeline = useDeletePipeline();

  const handleDeletePipeline = useCallback(() => {
    if (!pipeline) return;

    setMessageBoxState(() => ({
      activate: true,
      status: "progressing",
      description: null,
      message: "Deleting...",
    }));

    deletePipeline.mutate(pipeline.name, {
      onSuccess: () => {
        setMessageBoxState(() => ({
          activate: true,
          status: "success",
          description: null,
          message: "Delete succeeded",
        }));
        if (amplitudeIsInit) {
          sendAmplitudeData("delete_pipeline", {
            type: "critical_action",
            process: "destination",
          });
        }
        router.push("/pipelines");
      },
      onError: (error) => {
        if (error instanceof Error) {
          setMessageBoxState(() => ({
            activate: true,
            status: "error",
            description: null,
            message: error.message,
          }));
        } else {
          setMessageBoxState(() => ({
            activate: true,
            status: "error",
            description: null,
            message: "Something went wrong when delete the pipeline",
          }));
        }
      },
    });
    setDeletePipelineModalIsOpen(false);
  }, [pipeline, amplitudeIsInit, router, deletePipeline]);

  const determinePipelineState = useCallback(
    (values: ConfigurePipelineFormValue) => {
      switch (values.state) {
        case "STATE_ACTIVE":
          return true;
        case "STATE_ERROR":
          return false;
        case "STATE_UNSPECIFIED":
          return false;
        case "STATE_INACTIVE":
          return false;
        default:
          // If the values.state is null or undefinded
          return true;
      }
    },
    []
  );

  return (
    <>
      <Formik
        initialValues={
          {
            description: pipeline ? pipeline.description : null,
            state: pipeline ? pipeline.state : null,
          } as ConfigurePipelineFormValue
        }
        enableReinitialize={true}
        onSubmit={handleUpdatePipeline}
        validate={validateForm}
      >
        {({ values, errors, submitForm }) => {
          return (
            <FormikFormBase
              marginBottom={marginBottom}
              gapY={null}
              padding={null}
            >
              <div className="mb-10 flex flex-col gap-y-5">
                <ToggleField
                  id="pipelineState"
                  name="state"
                  label="State"
                  value={determinePipelineState(values)}
                  additionalMessageOnLabel={null}
                  error={errors?.state || null}
                  additionalOnChangeCb={null}
                  disabled={true}
                  readOnly={false}
                  required={true}
                  description=""
                />
                <TextArea
                  id="pipelineDescription"
                  name="description"
                  label="Description"
                  additionalMessageOnLabel={null}
                  description="Fill with a short description of your model"
                  value={values.description}
                  error={errors.description || null}
                  additionalOnChangeCb={null}
                  disabled={canEdit ? false : true}
                  readOnly={false}
                  required={true}
                  autoComplete="off"
                  placeholder=""
                  enableCounter={false}
                  counterWordLimit={0}
                />
              </div>
              <div className="mb-[60px] flex flex-col">
                <h3 className="mb-5 text-black text-instill-h3">Trigger</h3>
                <p className="text-black text-instill-body">
                  Please refer to the{" "}
                  <a href="#" className="text-instillBlue50">
                    guide
                  </a>{" "}
                  about how to trigger the pipeline
                </p>
              </div>
              <div className="mb-10 flex flex-row">
                <PrimaryButton
                  disabled={deletePipelineModalIsOpen ? true : false}
                  position="mr-auto my-auto"
                  type="button"
                  onClickHandler={() => setDeletePipelineModalIsOpen(true)}
                >
                  Delete
                </PrimaryButton>
                <PrimaryButton
                  disabled={false}
                  onClickHandler={() => handleEditButton(values, submitForm)}
                  position="ml-auto my-auto"
                  type="button"
                >
                  {canEdit ? "Done" : "Edit"}
                </PrimaryButton>
              </div>
              <div className="flex">
                <BasicProgressMessageBox
                  state={messageBoxState}
                  setState={setMessageBoxState}
                  width="w-[25vw]"
                  closable={true}
                />
              </div>
            </FormikFormBase>
          );
        }}
      </Formik>
      <DeleteResourceModal
        resource={pipeline}
        modalIsOpen={deletePipelineModalIsOpen}
        setModalIsOpen={setDeletePipelineModalIsOpen}
        handleDeleteResource={handleDeletePipeline}
      />
    </>
  );
};

export default ConfigurePipelineForm;
