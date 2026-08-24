/**
 * Shared keyword search utilities for consistent, safe regex across modules.
 * Escape user input to prevent regex injection/crash.
 */

export const escapeRegex = (input: string): string => {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const buildKeywordOrConditions = (
  keyword: string,
  fields: string[],
): Record<string, RegExp>[] => {
  const escapedKeyword = escapeRegex(keyword);
  const regex = new RegExp(escapedKeyword, 'i');

  return fields.map((field) => ({ [field]: regex }));
};