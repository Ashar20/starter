/**
 * EGS (Embeddable Game Standard) games list — powered by denshokan-sdk.
 * @see https://docs.provable.games/embeddable-game-standard
 */
import { useGames } from '@provable-games/denshokan-sdk/react';
import './EGSGamesSection.css';

export function EGSGamesSection() {
  const { data, isLoading, error, refetch } = useGames({ limit: 12 });

  if (isLoading && !data) {
    return (
      <section className="egs-section">
        <h2 className="egs-title">EGS Games</h2>
        <p className="egs-loading">Loading games from Embeddable Game Standard…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="egs-section">
        <h2 className="egs-title">EGS Games</h2>
        <p className="egs-error">Unable to load EGS games. ({error.message})</p>
        <button type="button" className="pixel-btn pixel-btn-small" onClick={() => refetch()}>
          Retry
        </button>
      </section>
    );
  }

  const games = data?.data ?? [];

  return (
    <section className="egs-section" id="egs">
      <h2 className="egs-title">EGS Games</h2>
      <p className="egs-subtitle">
        Provable on-chain games on Starknet via the{' '}
        <a
          href="https://docs.provable.games/embeddable-game-standard"
          target="_blank"
          rel="noopener noreferrer"
        >
          Embeddable Game Standard
        </a>
        . Contagion will appear here once registered.
      </p>
      {games.length === 0 ? (
        <p className="egs-empty">No games in the registry yet, or API returned none.</p>
      ) : (
        <div className="egs-grid">
          {games.map((game) => (
            <div key={game.contractAddress ?? game.gameId} className="pixel-card egs-card">
              <div className="egs-card-name">{game.name ?? 'Unnamed'}</div>
              {game.description && (
                <p className="egs-card-desc">{game.description}</p>
              )}
              <div className="egs-card-meta">
                {game.genre && <span className="egs-tag">{game.genre}</span>}
                {game.developer && <span className="egs-tag">{game.developer}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
