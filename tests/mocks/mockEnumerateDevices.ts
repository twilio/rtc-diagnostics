export function mockEnumerateDevicesFactory(options: {
  devices: MediaDeviceInfo[],
  doThrow?: any;
} = {
  devices: [],
}) {
  return async (): Promise<MediaDeviceInfo[]> => {
    if (options.doThrow) {
      throw options.doThrow;
    }
    return options.devices;
  };
}
