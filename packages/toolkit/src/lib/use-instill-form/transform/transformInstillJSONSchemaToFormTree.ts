import { JSONSchema7TypeName } from "json-schema";
import { Nullable } from "../../type";
import { pickConstInfoFromOneOfCondition } from "../pick";
import {
  InstillFormGroupItem,
  InstillFormTree,
  InstillJSONSchema,
  InstillJSONSchemaDefinition,
  CheckIsHidden,
  InstillFormItem,
} from "../type";

export type TransformInstillJSONSchemaToFormTreeOptions = {
  key?: string;
  path?: string;
  parentSchema?: InstillJSONSchema;
  checkIsHidden?: CheckIsHidden;
};

export function transformInstillJSONSchemaToFormTree(
  targetSchema: InstillJSONSchemaDefinition,
  options?: TransformInstillJSONSchemaToFormTreeOptions
): InstillFormTree {
  let isRequired = false;
  const key = options?.key;
  const path = options?.path;
  const parentSchema = options?.parentSchema;
  const checkIsHidden = options?.checkIsHidden;

  if (
    key &&
    typeof parentSchema !== "boolean" &&
    Array.isArray(parentSchema?.required) &&
    parentSchema?.required.includes(key)
  ) {
    isRequired = true;
  }

  if (typeof targetSchema === "boolean") {
    return {
      _type: "formItem",
      fieldKey: key ?? null,
      path: (path || key) ?? null,
      isRequired: false,
      type: "null",
    };
  }

  let isHidden = false;

  if (
    checkIsHidden &&
    checkIsHidden({
      parentSchema: parentSchema ?? null,
      targetSchema,
      targetKey: key ?? null,
    })
  ) {
    isHidden = true;
  }

  const baseFields = pickBaseFields(targetSchema);

  // 1. Preprocess

  let type: Nullable<JSONSchema7TypeName> = null;

  // 1.1 Get the type and instillAcceptFormats from anyOf field
  if (targetSchema.anyOf && targetSchema.anyOf.length > 0) {
    const instillUpstreamValue = targetSchema.anyOf.find(
      (e) => e.instillUpstreamType === "value"
    );

    if (instillUpstreamValue) {
      if (Array.isArray(instillUpstreamValue.type)) {
        type = instillUpstreamValue.type[0];
      } else {
        type = instillUpstreamValue.type ?? null;
      }

      // We will store information of enum in anyOf field
      if (instillUpstreamValue.enum) {
        return {
          ...baseFields,
          _type: "formItem",
          fieldKey: key ?? null,
          path: (path || key) ?? null,
          isRequired,
          type: type ? type : "null",
          enum: instillUpstreamValue.enum,
          example: instillUpstreamValue.example,
          examples: instillUpstreamValue.examples,
          isHidden,
          instillAcceptFormats: baseFields.instillAcceptFormats
            ? baseFields.instillAcceptFormats
            : [],
        };
      }
    }
  } else {
    if (Array.isArray(targetSchema.type)) {
      type = targetSchema.type[0] ?? null;
    } else {
      type = targetSchema.type ?? null;
    }
  }

  // 2. Main process

  if (targetSchema.oneOf && targetSchema.oneOf.length > 0) {
    const conditions = Object.fromEntries(
      targetSchema.oneOf.map((condition) => {
        if (typeof condition === "boolean") {
          return [];
        }

        const { constKey, constValue } = pickConstInfoFromOneOfCondition(
          condition.properties ?? {}
        );

        if (!constKey || !constValue) {
          return [];
        }

        return [
          constValue,
          transformInstillJSONSchemaToFormTree(
            { type: targetSchema.type, ...condition },
            {
              parentSchema,
              key,
              path,
              checkIsHidden,
            }
          ),
        ];
      })
    );

    const constField = targetSchema.oneOf[0].properties
      ? Object.entries(targetSchema.oneOf[0].properties).find(
          ([, property]) => "const" in property
        )?.[1]
      : undefined;

    const constBaseFields = pickBaseFields(constField ?? {});

    delete constBaseFields.const;

    return {
      ...constBaseFields,
      ...baseFields,
      _type: "formCondition",
      fieldKey: key ?? null,
      path: (path || key) ?? null,
      conditions,
      isRequired,
      jsonSchema: targetSchema,
    };
  }

  if (
    targetSchema.type === "array" &&
    typeof targetSchema.items === "object" &&
    !Array.isArray(targetSchema.items)
  ) {
    if (targetSchema.items.type === "object") {
      const itemsFormTree = transformInstillJSONSchemaToFormTree(
        targetSchema.items,
        {
          parentSchema: targetSchema,
          key,
          path,
          checkIsHidden,
        }
      );

      return {
        ...baseFields,
        properties: itemsFormTree,
        jsonSchema: targetSchema,
        _type: "objectArray",
        fieldKey: key ?? null,
        path: (path || key) ?? null,
        isRequired,
      };
    } else {
      return {
        ...pickBaseFields(targetSchema.items),
        ...baseFields,
        _type: "formItem",
        fieldKey: key ?? null,
        path: (path || key) ?? null,
        isRequired,
        type: "array",
        instillAcceptFormats: baseFields.instillAcceptFormats
          ? baseFields.instillAcceptFormats
          : [],
      };
    }
  }

  if (targetSchema.properties) {
    const properties = Object.entries(targetSchema.properties || [])
      .map(([key, schema]) =>
        transformInstillJSONSchemaToFormTree(schema, {
          parentSchema: targetSchema,
          key,
          path: path ? `${path}.${key}` : key,
          checkIsHidden,
        })
      )
      .sort((a, b) => {
        if (typeof a.instillUIOrder === "undefined") {
          return 1;
        }

        if (typeof b.instillUIOrder === "undefined") {
          return -1;
        }

        return a.instillUIOrder > b.instillUIOrder ? 1 : -1;
      });

    return {
      ...baseFields,
      _type: "formGroup",
      fieldKey: key ?? null,
      path: (path || key) ?? null,
      isRequired,
      jsonSchema: targetSchema,
      properties: properties ?? [],
    };
  }

  // 3. Post process

  return {
    ...baseFields,
    _type: "formItem",
    fieldKey: key ?? null,
    path: (path || key) ?? null,
    isRequired,
    type: type ? type : "null",
    isHidden,
    instillAcceptFormats: baseFields.instillAcceptFormats
      ? baseFields.instillAcceptFormats
      : [],
  };
}

const baseFields: Array<keyof InstillJSONSchema> = [
  "default",
  "example",
  "examples",
  "description",
  "pattern",
  "const",
  "title",
  "instillShortDescription",
  "instillUpstreamTypes",
  "instillUpstreamType",
  "instillFormat",
  "instillAcceptFormats",
  "instillCredentialField",
  "instillUIOrder",
  "instillEditOnNodeFields",
];

function pickBaseFields(schema: InstillJSONSchema): Partial<InstillJSONSchema> {
  const partialSchema: Partial<InstillJSONSchema> = {
    ...Object.fromEntries(
      Object.entries(schema).filter(([k]) =>
        baseFields.includes(k as keyof InstillJSONSchema)
      )
    ),
  };

  if (
    typeof schema.items === "object" &&
    !Array.isArray(schema.items) &&
    schema.items.enum
  ) {
    partialSchema.enum = schema.items.enum;
  } else if (schema.enum) {
    if (schema.enum?.length === 1 && isDefined(schema.default)) {
      partialSchema.const = schema.default;
    } else {
      partialSchema.enum = schema.enum;
    }
  }

  return partialSchema;
}

function isDefined<T>(
  a: T | null | undefined
): a is Exclude<T, null | undefined> {
  return a !== undefined && a !== null;
}
