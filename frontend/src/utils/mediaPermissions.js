export async function queryMediaPermissionState() {
  if (!navigator.permissions?.query) {
    return { camera: 'unknown', microphone: 'unknown' };
  }

  const read = async (name) => {
    try {
      const result = await navigator.permissions.query({ name });
      return result.state;
    } catch {
      return 'unknown';
    }
  };

  const [camera, microphone] = await Promise.all([
    read('camera'),
    read('microphone'),
  ]);

  return { camera, microphone };
}

export function classifyMediaError(error) {
  const name = error?.name || '';
  const message = error?.message || '';
  const lower = message.toLowerCase();

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'permission_denied';
  }

  if (name === 'NotReadableError' || lower.includes('could not start video source') || lower.includes('device in use')) {
    return 'device_busy';
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'device_missing';
  }

  return 'unknown';
}
