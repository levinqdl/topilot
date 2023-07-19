export default function parseSchema(schema: any) {
  if (schema)
    for (const [key, value] of Object.entries<{ options: [] }>(schema.shape)) {
      if (value.options) {
        return [{ name: key, options: value.options }];
      }
    }
  return [];
}
