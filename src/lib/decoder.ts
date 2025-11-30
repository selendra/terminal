/**
 * Substrate decoder utilities for Selendra blockchain
 * Decodes extrinsics and events from Substrate blocks
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = any;

export interface DecodedExtrinsic {
  method: string;
  section: string;
  args: unknown[];
  signer: string | undefined;
  isSigned: boolean;
}

export interface DecodedEvent {
  section: string;
  method: string;
  data: unknown[];
  phase: unknown;
}

/**
 * Decode a Substrate extrinsic into a human-readable format
 * @param extrinsic - The extrinsic to decode from @polkadot/types
 * @returns Decoded extrinsic with method, section, args, signer, and isSigned
 */
export function decodeExtrinsic(extrinsic: AnyType): DecodedExtrinsic {
  return {
    method: extrinsic.method.method,
    section: extrinsic.method.section,
    args: extrinsic.method.args.map((a: AnyType) => a.toHuman()),
    signer: extrinsic.signer?.toString(),
    isSigned: extrinsic.isSigned,
  };
}

/**
 * Decode an array of Substrate events into human-readable format
 * @param events - Array of event records from api.query.system.events
 * @returns Array of decoded events with section, method, data, and phase
 */
export function decodeEvents(events: AnyType[]): DecodedEvent[] {
  return events.map((record) => {
    const { event, phase } = record;
    return {
      section: event.section,
      method: event.method,
      data: event.data.map((d: AnyType) => d.toHuman()),
      phase: phase.toHuman(),
    };
  });
}

/**
 * Decode a batch of extrinsics
 * @param extrinsics - Array of extrinsics from a block
 * @returns Array of decoded extrinsics
 */
export function decodeExtrinsics(extrinsics: AnyType[]): DecodedExtrinsic[] {
  return extrinsics.map(decodeExtrinsic);
}
