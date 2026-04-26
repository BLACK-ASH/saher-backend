type UnknownObject = Record<string, unknown>;

const isObjectId = (val: unknown): val is { _bsontype: string; toString: () => string } => {
  return (
    typeof val === 'object' &&
    val !== null &&
    '_bsontype' in val &&
    (val as { _bsontype: string })._bsontype === 'ObjectId'
  );
};

export const normalizeDoc = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(normalizeDoc);
  }

  if (typeof obj === 'object' && obj !== null) {
    const result: UnknownObject = {};

    for (const [key, value] of Object.entries(obj)) {
      if (key === '_id' && isObjectId(value)) {
        result.id = value.toString();
        continue;
      }

      let newValue = value;

      if (isObjectId(newValue)) {
        newValue = newValue.toString();
      }

      if (newValue instanceof Date) {
        newValue = newValue.toISOString();
      }

      result[key] = normalizeDoc(newValue);
    }

    return result;
  }

  return obj;
};
