export function mockBlobFactory(opts?: Partial<{
  size: number,
  type: string,
}>) {
  const {
    size,
    type,
  } = {
    size: 0,
    type: 'foobar',
    ...opts,
  };
  return class {
    size = size;
    type = type;
  };
}
