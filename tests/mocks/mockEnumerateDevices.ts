export function mockEnumerateDevicesFactory(options: {
  devices: MediaDeviceInfo[],
  throw?: any;
} = {
  devices: [],
}) {
  return async (): Promise<MediaDeviceInfo[]> => {
    if (options.throw) {
      throw options.throw;
    }
    return options.devices;
  };
}
