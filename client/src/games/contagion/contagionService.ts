/**
 * Contagion service stub — no Stellar on-chain calls.
 * Game runs entirely over WebSocket. Dojo/EGS integration can be added later.
 */
export class ContagionService {
  constructor(_contractId: string) {}

  async getGame(_sessionId: number) {
    return null;
  }

  async getProof(_sessionId: number, _player: string) {
    return null;
  }

  async submitProof(
    _sessionId: number,
    _player: string,
    _tick: number,
    _status: boolean,
    _commitment: string,
    _proof: string,
    _signer: unknown
  ) {
    console.warn('[Contagion] On-chain proof submission disabled (no Stellar). WebSocket gameplay works.');
  }
}
