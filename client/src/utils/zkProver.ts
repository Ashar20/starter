/**
 * ZK Prover — Health Proof generation
 *
 * Generates a NOIR UltraHonk proof that a player's claimed health status
 * matches the server-issued commitment, without revealing the nonce.
 *
 * Circuit inputs:
 *   Private: status (0=infected, 1=healthy), nonce
 *   Public:  player_id_hash, tick, revealed_status; commitment is circuit return value
 *
 * Trust model:
 *   Server generates a random nonce and sends it privately with the test result.
 *   Client computes commitment = pedersen_hash([player_id_hash, status, tick, nonce]).
 *   Client generates a proof binding the commitment to the status.
 *   Other players verify the proof without learning the nonce.
 */

import { Barretenberg, UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';
import type { CompiledCircuit } from '@noir-lang/types';
import circuitJson from '../assets/health_proof.json';

const _circuit = circuitJson as unknown as CompiledCircuit;

function loadCircuit(): CompiledCircuit {
  return _circuit;
}

// Lazy-loaded backend (shared across proof generations — each instance leaks WASM heap)
let _backendPromise: Promise<UltraHonkBackend> | null = null;

async function getBackend(): Promise<UltraHonkBackend> {
  if (!_backendPromise) {
    _backendPromise = Barretenberg.new({ threads: 1 }).then(
      bb => new UltraHonkBackend(_circuit.bytecode, bb),
    );
  }
  return _backendPromise;
}

export interface ZKProofInputs {
  /** 0 = infected, 1 = healthy (as hex or decimal string) */
  status: string;
  /** server-issued nonce as hex string (62 hex chars / 31 bytes) */
  nonce: string;
  /** sha256(player_id)[1..32] as hex string (server-computed) */
  playerIdHash: string;
  /** game tick as decimal string */
  tick: string;
}

export interface ZKProofResult {
  /** UltraHonk proof bytes as hex string */
  proof: string;
  /** Public inputs as array of hex strings: [player_id_hash, tick, commitment, revealed_status] */
  publicInputs: string[];
  /** Pedersen commitment as hex string */
  commitment: string;
}

/**
 * Generate a ZK health proof.
 *
 * Commitment is computed inside the circuit (Noir pedersen_hash) and returned
 * as a public output — no Barretenberg precomputation needed.
 *
 * @param inputs - Private and public inputs from the server test result
 * @returns Proof data ready for broadcasting and on-chain submission
 */
export async function generateHealthProof(inputs: ZKProofInputs): Promise<ZKProofResult> {
  const circuit = loadCircuit();

  // Build circuit inputs (no commitment — circuit computes and returns it)
  const statusNum = inputs.status === '1' || inputs.status === '0x01' ? '1' : '0';
  const circuitInputs = {
    status: statusNum,
    nonce: `0x${inputs.nonce.replace(/^0x/, '')}`,
    player_id_hash: `0x${inputs.playerIdHash.replace(/^0x/, '')}`,
    tick: inputs.tick,
    revealed_status: statusNum,
  };

  // Generate witness
  const noir = new Noir(circuit);
  await noir.init();
  const { witness } = await noir.execute(circuitInputs);

  // Generate proof using UltraHonk backend (singleton — reuse to avoid WASM heap leaks)
  const backend = await getBackend();
  const proofData = await backend.generateProof(witness);

  const proofHex =
    '0x' +
    Array.from(proofData.proof)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

  // Commitment is the circuit return value — appended as last public input
  const commitment = proofData.publicInputs[proofData.publicInputs.length - 1] ?? '';

  return {
    proof: proofHex,
    publicInputs: proofData.publicInputs,
    commitment,
  };
}

/** Warm up the WASM backend (call on app mount to reduce first-proof latency). */
export async function warmupZKBackend(): Promise<void> {
  await getBackend();
}
