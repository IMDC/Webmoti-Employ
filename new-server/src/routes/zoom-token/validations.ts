import { isStringArray, isValidationError, toStringArray } from "./utils.js";

/* CURRIED VALIDATORS */
export const inNumberArray =
  (allowedNumbers: Array<number>) => (property: string, value: unknown) => {
    if (typeof value === "undefined") return;

    if (typeof value !== "number" || isNaN(value)) {
      return {
        property,
        reason: `Value ${value} not allowed, must be of type number`,
      };
    }

    if (!allowedNumbers.includes(value)) {
      return {
        property,
        reason: `Value is not valid. Got ${value}, expected ${allowedNumbers}`,
      };
    }
  };

export const isBetween =
  (min: number, max: number) => (property: string, value: unknown) => {
    if (typeof value === "undefined") return;

    if (typeof value !== "number" || isNaN(value)) {
      return {
        property,
        reason: `Value ${value} not allowed, must be of type number`,
      };
    }

    if (value < min || value > max) {
      return {
        property,
        reason: `Value must in between ${min} and ${max}`,
      };
    }
  };

export const isLengthLessThan =
  (maxLength: number) => (property: string, value: unknown) => {
    if (typeof value === "undefined") return;

    if (typeof value !== "string") {
      return {
        property,
        reason: `Value ${value} not allowed, must be of type string`,
      };
    }

    if (value.length > maxLength) {
      return {
        property,
        reason: `Value exceed max length. Got ${value.length}, expected less than or equal to ${maxLength}`,
      };
    }
  };

export const isRequired = (property: string, value: unknown) => {
  if (typeof value === "undefined") {
    return {
      property,
      reason: `Property required, but not present in request body`,
    };
  }
};

export const matchesStringArray =
  (allowedStrings: Array<string>) => (property: string, value: unknown) => {
    if (typeof value === "undefined") return;

    if (typeof value !== "string" && !isStringArray(value)) {
      return {
        property,
        reason: `Value ${value} not allowed, must be of type string or string array`,
      };
    }

    const arr = toStringArray(value);

    if (arr.length === 0) {
      return {
        property,
        reason: `Property defined, but not value(s) were present`,
      };
    }

    if (!arr.every((x: string) => allowedStrings.includes(x))) {
      return {
        property,
        reason: `One or more value(s) not allowed. Got (${arr}), expected (${allowedStrings})`,
      };
    }
  };

export type ValidationError = {
  property: string;
  reason: string;
};

type ValidationFn = (
  property: string,
  value: unknown
) => ValidationError | undefined;

type Validator = Record<string, ValidationFn | ValidationFn[]>;

/* VALIDATION RUNNER */
export const validateRequest = (
  body: Record<string, unknown>,
  validator: Validator
) =>
  Object.keys(validator)
    .flatMap((property) => {
      const value = body?.[property];
      const func = validator[property];
      const validations = Array.isArray(func)
        ? func.map((f) => f(property, value))
        : func?.(property, value);
      return Array.isArray(validations) ? validations : [validations];
    })
    .filter(isValidationError);
