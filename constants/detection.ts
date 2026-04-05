/**
 * How often to capture a frame and send to Roboflow (ms).
 * 5s balances battery vs freshness for long matches (e.g. ~1.5h on a phone like Galaxy S23).
 */
export const DETECTION_INTERVAL_MS = 5000;

/**
 * JPEG quality for takePictureAsync (0–1). Lower = smaller uploads and less CPU/battery.
 * Tune if the model struggles; 0.35 is usually enough for ball detection at table distance.
 */
export const CAPTURE_JPEG_QUALITY = 0.35;
