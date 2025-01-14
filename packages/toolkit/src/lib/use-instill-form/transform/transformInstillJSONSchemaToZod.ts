import * as z from "zod";
import {
  CheckIsHidden,
  InstillJSONSchema,
  SelectedConditionMap,
  instillZodSchema,
} from "../type";
import { pickConstInfoFromOneOfCondition } from "../pick";
import { getReferencesFromString } from "../../../view";

export function transformInstillJSONSchemaToZod({
  parentSchema,
  targetSchema,
  selectedConditionMap,
  propertyKey,
  propertyPath,
  forceOptional,
  checkIsHidden,
}: {
  parentSchema: InstillJSONSchema;
  targetSchema: InstillJSONSchema;
  selectedConditionMap: SelectedConditionMap | null;
  propertyKey?: string;
  propertyPath?: string;
  forceOptional?: boolean;
  checkIsHidden?: CheckIsHidden;
}): instillZodSchema {
  let instillZodSchema: z.ZodTypeAny = z.any();

  const isHidden = checkIsHidden
    ? checkIsHidden({
        parentSchema,
        targetSchema,
        targetKey: propertyKey ?? null,
        targetPath: propertyPath ?? null,
      })
    : false;

  const isRequired = propertyKey
    ? Array.isArray(parentSchema.required) &&
      parentSchema.required.includes(propertyKey)
    : false;

  // const field will only be used in oneOf field conditions
  if (targetSchema.const) {
    instillZodSchema = z.string();

    if (isHidden) {
      instillZodSchema = instillZodSchema.nullable().optional();
    }

    return instillZodSchema;
  }

  // Handle oneOf field
  if (targetSchema.oneOf) {
    const oneOfConditions = targetSchema.oneOf as InstillJSONSchema[];

    const selectedSchema = selectedConditionMap
      ? oneOfConditions.find((condition) => {
          const { constKey, constValue } = pickConstInfoFromOneOfCondition(
            condition.properties ?? {}
          );

          const accessPath = propertyPath
            ? `${propertyPath}.${constKey}`
            : constKey;

          if (!accessPath) {
            return false;
          }

          return (
            constKey &&
            constValue &&
            selectedConditionMap[accessPath] === constValue
          );
        })
      : oneOfConditions[0];

    if (selectedSchema) {
      instillZodSchema = transformInstillJSONSchemaToZod({
        parentSchema,
        targetSchema: { type: targetSchema.type, ...selectedSchema },
        selectedConditionMap,
        propertyKey,
        propertyPath,
        checkIsHidden,
      });
    }

    if (isHidden) {
      instillZodSchema = instillZodSchema.nullable().optional();
    }

    return instillZodSchema;
  }

  // Handle the enum fields
  if (targetSchema.enum) {
    // We need to do the castring here to make typescript happy.
    // The reason is typescript need to know the amount of the element
    // in the enum, but the enum is dynamic right here, so the ts will
    // complaint about it.
    // ref: https://github.com/colinhacks/zod/issues/2376

    const enumValues = targetSchema.enum as [string, ...string[]];
    instillZodSchema = z.enum(enumValues);

    if (isHidden) {
      instillZodSchema = z.any();
    }

    if (!isRequired || forceOptional) {
      instillZodSchema = instillZodSchema.nullable().optional();
    }

    return instillZodSchema;
  }

  if (targetSchema.type === "array") {
    if (
      typeof targetSchema.items === "object" &&
      !Array.isArray(targetSchema.items)
    ) {
      const arraySchema = z.array(
        transformInstillJSONSchemaToZod({
          parentSchema,
          targetSchema: targetSchema.items as InstillJSONSchema,
          selectedConditionMap,
          checkIsHidden,
        })
      );

      instillZodSchema = arraySchema;

      if (!isRequired || forceOptional || isHidden) {
        instillZodSchema = instillZodSchema.nullable().optional();
      }
    }
    return instillZodSchema;
  }

  if (targetSchema.type === "object") {
    // temporarily override Airbyte's free form schema, if it's object without
    // any properties and have patternProperties attribute, it's indicating
    // Airbyte free form, we need additional components to handle this case.

    if (targetSchema.patternProperties && !targetSchema.properties) {
      instillZodSchema = z.any();

      return instillZodSchema;
    }

    const objectProperties = targetSchema.properties ?? {};

    // We need to consider semi-structured object here. This kind of object
    // accept the object input from start operator.
    if (
      targetSchema.instillAcceptFormats?.some((format) =>
        format.includes("semi-structured")
      )
    ) {
      instillZodSchema = z.string();

      if (!isRequired || forceOptional || isHidden) {
        instillZodSchema = instillZodSchema.nullable().optional();
      }

      return instillZodSchema;
    }

    let objectSchema = z.object({});

    for (const [entryKey, entryJsonSchema] of Object.entries(
      objectProperties
    )) {
      if (typeof entryJsonSchema !== "boolean") {
        objectSchema = objectSchema.extend({
          [entryKey]: transformInstillJSONSchemaToZod({
            parentSchema: targetSchema,
            targetSchema: entryJsonSchema,
            propertyKey: entryKey,
            propertyPath: propertyPath
              ? `${propertyPath}.${entryKey}`
              : entryKey,
            selectedConditionMap,
            checkIsHidden,
          }),
        });
      }
    }

    instillZodSchema = objectSchema;

    if (!isRequired || forceOptional || isHidden) {
      instillZodSchema = instillZodSchema.nullable().optional();
    }

    return instillZodSchema;
  }

  /* -------------------------------------------------------------------------
     Handle anyOf field (anyOf will onlye be used to setup 
     instillUpstreamTypes)

     Most of the time, the schema's fields will have anyOf field,
   * -----------------------------------------------------------------------*/

  if (targetSchema.anyOf && targetSchema.anyOf.length > 0) {
    const instillUpstreamValue = targetSchema.anyOf.find(
      (e) => e.instillUpstreamType === "value"
    );

    const acceptPrimitive = instillUpstreamValue ? true : false;

    const acceptReference = targetSchema.anyOf.some(
      (e) => e.instillUpstreamType === "reference"
    );

    const acceptTemplate = targetSchema.anyOf.some(
      (e) => e.instillUpstreamType === "template"
    );

    if (instillUpstreamValue) {
      if (instillUpstreamValue.enum) {
        const enumValues = instillUpstreamValue.enum as [string, ...string[]];
        instillZodSchema = z.enum(enumValues);
      } else {
        switch (instillUpstreamValue.type) {
          case "string": {
            if (isRequired) {
              instillZodSchema = z
                .string({
                  errorMap: customErrorMap,
                })
                .min(1, "This field is required");
            } else {
              instillZodSchema = z.string({
                errorMap: customErrorMap,
              });
            }
            break;
          }
          case "boolean": {
            instillZodSchema = z.boolean();
            break;
          }
          case "integer":
          case "number": {
            // Because number field can also write string as reference. We need to
            // set the initial zod schema to string and then validate it with
            // superRefine.

            if (isRequired) {
              instillZodSchema = z.string().min(1, "This field is required");
            } else {
              instillZodSchema = z.string();
            }
            break;
          }
        }
      }
    } else {
      if (isRequired) {
        instillZodSchema = z
          .string({
            errorMap: customErrorMap,
          })
          .min(1, "This field is required");
      } else {
        instillZodSchema = z.string({
          errorMap: customErrorMap,
        });
      }
    }

    /* -----------------------------------------------------------------------
      We use superRefine to validate the value of the field with reference
      and template 
    * -----------------------------------------------------------------------*/

    instillZodSchema = instillZodSchema.superRefine((val, ctx) => {
      if (isHidden) {
        return;
      }

      if (val === "") {
        return;
      }

      if (typeof val === "string") {
        // Process regex pattern

        if (instillUpstreamValue && instillUpstreamValue.pattern) {
          const regexPattern = new RegExp(instillUpstreamValue.pattern);

          if (!regexPattern.test(val)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: instillUpstreamValue.instillPatternErrorMessage
                ? instillUpstreamValue.instillPatternErrorMessage
                : `This field doesn't match the pattern ${instillUpstreamValue.pattern}`,
            });
          }
        }

        const references = getReferencesFromString(val);

        if (!acceptPrimitive && references.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "This field only accepts reference",
          });
        }

        if (references.length > 0 && !acceptReference) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "This field doesn't accept reference `${}`",
          });
        }

        if (references.length > 1 && !acceptTemplate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "This field only accepts single reference",
          });
        }

        if (
          references.length === 0 &&
          instillUpstreamValue &&
          (instillUpstreamValue.type === "integer" ||
            instillUpstreamValue.type === "number")
        ) {
          if (isNaN(Number(val))) {
            if (acceptReference) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "This field only accepts number or reference",
              });
            } else {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "This field only accepts number",
              });
            }
          }
        }
      }
    });

    if (isHidden) {
      instillZodSchema = z.any();
    }

    if (!isRequired || forceOptional) {
      instillZodSchema = instillZodSchema.nullable().optional();
    }

    return instillZodSchema;
  }

  /* -------------------------------------------------------------------------
     Handle the primitive fields
   * -----------------------------------------------------------------------*/

  if (targetSchema.enum) {
    // We need to do the castring here to make typescript happy.
    // The reason is typescript need to know the amount of the element
    // in the enum, but the enum is dynamic right here, so the ts will
    // complaint about it.
    // ref: https://github.com/colinhacks/zod/issues/2376

    const enumValues = targetSchema.enum as [string, ...string[]];
    instillZodSchema = z.enum(enumValues);

    const isRequired = propertyKey
      ? Array.isArray(parentSchema.required) &&
        parentSchema.required.includes(propertyKey)
      : false;

    if (isHidden) {
      instillZodSchema = z.any();
    }

    if (!isRequired || forceOptional) {
      instillZodSchema = instillZodSchema.nullable().optional();
    }

    return instillZodSchema;
  }

  switch (targetSchema.type) {
    case "string": {
      if (isRequired) {
        instillZodSchema = z
          .string({
            errorMap: customErrorMap,
          })
          .min(1, "This field is required");
      } else {
        instillZodSchema = z.string({
          errorMap: customErrorMap,
        });
      }

      break;
    }
    case "boolean": {
      instillZodSchema = z.boolean();
      break;
    }
    case "integer":
    case "number": {
      // Because number field can also write string as reference. We need to
      // set the initial zod schema to string and then validate it with
      // superRefine.

      if (isRequired) {
        instillZodSchema = z.string().min(1, "This field is required");
      } else {
        instillZodSchema = z.string();
      }
      break;
    }
  }

  instillZodSchema = instillZodSchema.superRefine((val, ctx) => {
    if (targetSchema.pattern) {
      const regexPattern = new RegExp(targetSchema.pattern);

      if (!regexPattern.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: targetSchema.instillPatternErrorMessage
            ? targetSchema.instillPatternErrorMessage
            : `This field doesn't match the pattern ${targetSchema.pattern}`,
        });
      }
    }
  });

  if (isHidden) {
    instillZodSchema = z.any();
  }

  if (!isRequired || forceOptional) {
    instillZodSchema = instillZodSchema.nullable().optional();
  }

  return instillZodSchema;
}

const customErrorMap: z.ZodErrorMap = (error, ctx) => {
  /*
  This is where you override the various error codes
  */
  switch (error.code) {
    case z.ZodIssueCode.invalid_type:
      if (error.expected === "string" && ctx.data === null) {
        return { message: "This field is required" };
      }
      break;
  }

  // fall back to default message!
  return { message: ctx.defaultError };
};
