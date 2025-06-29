export const isDefined = (str: string) => !!str;

export const isStringArray = (value: unknown) =>
  Array.isArray(value) && value.every((x) => typeof x === "string");

export const isValidationError = (value: unknown) =>
  typeof value === "object" &&
  value !== null &&
  "property" in value &&
  "reason" in value &&
  typeof value?.property !== "undefined" &&
  typeof value?.reason !== "undefined";

export const replaceWhitespace = (str: string) => str.replace(/\s+/g, "");

export const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((v) => (typeof v === "string" ? replaceWhitespace(v) : ""))
      .filter(isDefined);
  }

  if (typeof value === "string") {
    return value.split(",").map(replaceWhitespace).filter(isDefined);
  }

  return [];
};
