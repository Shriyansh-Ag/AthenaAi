/**
 * Abstract virus scan interface.
 *
 * In production this would integrate with ClamAV, VirusTotal,
 * or a cloud-based scanning service.
 */

export interface ScanResult {
  clean: boolean;
  threat?: string;
  scanDurationMs: number;
}

export interface VirusScanProvider {
  scan(buffer: Buffer, filename: string): Promise<ScanResult>;
}

/**
 * No-op virus scanner for development.
 * Always returns clean. Replace with a real implementation in production.
 */
export class NoOpVirusScanner implements VirusScanProvider {
  async scan(_buffer: Buffer, _filename: string): Promise<ScanResult> {
    return {
      clean: true,
      scanDurationMs: 0,
    };
  }
}
