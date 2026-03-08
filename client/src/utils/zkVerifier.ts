/**
 * ZK Verifier — Health Proof verification
 *
 * Verifies NOIR UltraHonk proofs broadcast by other players.
 * Runs entirely client-side using WASM.
 */

import { Barretenberg, UltraHonkBackend } from '@aztec/bb.js';
import type { CompiledCircuit } from '@noir-lang/types';
import circuitJson from '../assets/health_proof.json';

const _circuit = circuitJson as unknown as CompiledCircuit;

// Reuse a single backend instance (creating one is expensive)
let _backendPromise: Promise<UltraHonkBackend> | null = null;

async function getBackend(): Promise<UltraHonkBackend> {
  if (!_backendPromise) {
    _backendPromise = Barretenberg.new({ threads: 1 }).then(
      bb => new UltraHonkBackend(_circuit.bytecode, bb),
    );
  }
  return _backendPromise;
}

export interface IncomingProof {
  /** UltraHonk proof as hex string (0x-prefixed) */
  proof: string;
  /** Public inputs as array of hex strings */
  publicInputs: string[];
  /** Expected commitment (last public input when circuit returns it) */
  commitment?: string;
}

/**
 * Verify a health proof broadcast by another player.
 *
 * @returns true if the proof is cryptographically valid
 */
export async function verifyHealthProof(data: IncomingProof): Promise<boolean> {
  try {
    const backend = await getBackend();

    // Decode proof bytes from hex string
    const proofHex = data.proof.replace(/^0x/, '');
    const proofBytes = new Uint8Array(proofHex.length / 2);
    for (let i = 0; i < proofBytes.length; i++) {
      proofBytes[i] = parseInt(proofHex.slice(i * 2, i * 2 + 2), 16);
    }

    // publicInputs are already hex strings (0x-prefixed) as stored in ProofData
    const publicInputs: string[] = data.publicInputs;

    const valid = await backend.verifyProof({ proof: proofBytes, publicInputs });
    return valid;
  } catch (err) {
    console.warn('[ZK] Proof verification failed:', err);
    return false;
  }
}

/**
 * Extract the revealed status from proof public inputs.
 * Public input order: [player_id_hash, tick, revealed_status, commitment]
 * (commitment is circuit return value, appended last)
 *
 * @returns 'HEALTHY' | 'INFECTED' | null if unparseable
 */
export function extractStatusFromPublicInputs(publicInputs: string[]): 'HEALTHY' | 'INFECTED' | null {
  if (publicInputs.length < 3) return null;
  try {
    // revealed_status is the 3rd public input (index 2)
    const hex = publicInputs[2].replace(/^0x/, '').replace(/^0+/, '') || '0';
    const val = parseInt(hex, 16);
    if (val === 1) return 'HEALTHY';
    if (val === 0) return 'INFECTED';
    return null;
  } catch {
    return null;
  }
}
