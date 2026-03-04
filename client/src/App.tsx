import { useEffect, useState } from "react";
import { KeysClause, ToriiQueryBuilder } from "@dojoengine/sdk";
import {
  useDojoSDK,
  useEntityId,
  useEntityQuery,
  useModel,
} from "@dojoengine/sdk/react";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { ControllerConnector } from "@cartridge/connector";
import { addAddressPadding, CairoCustomEnum } from "starknet";
import { ModelsMapping } from "./dojo/models";
import "./App.css";

type Direction = "Left" | "Right" | "Up" | "Down";

const GRID_SIZE = 7;
const HALF = Math.floor(GRID_SIZE / 2);

function TileGrid({ x, y }: { x: number; y: number }) {
  const tiles = [];
  for (let row = HALF; row >= -HALF; row--) {
    for (let col = -HALF; col <= HALF; col++) {
      const tx = x + col;
      const ty = y + row;
      const isPlayer = col === 0 && row === 0;
      tiles.push(
        <div key={`${col},${row}`} className={`tile${isPlayer ? " tile-player" : ""}`}>
          {isPlayer && <span className="tile-player-marker">&#9670;</span>}
          <span className="tile-coord">{tx},{ty}</span>
        </div>
      );
    }
  }
  return (
    <div className="grid-container">
      <div className="grid-label">Position ({x}, {y})</div>
      <div className="tile-grid">{tiles}</div>
    </div>
  );
}

function CompassRose({ onMove, disabled }: { onMove: (d: Direction) => void; disabled: boolean }) {
  return (
    <div className="compass">
      <button className="compass-btn compass-north" onClick={() => onMove("Up")} disabled={disabled}>N</button>
      <button className="compass-btn compass-west" onClick={() => onMove("Left")} disabled={disabled}>W</button>
      <div className="compass-center">&#10022;</div>
      <button className="compass-btn compass-east" onClick={() => onMove("Right")} disabled={disabled}>E</button>
      <button className="compass-btn compass-south" onClick={() => onMove("Down")} disabled={disabled}>S</button>
    </div>
  );
}

function App() {
  const { client } = useDojoSDK();
  const { account, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [pending, setPending] = useState(false);
  const [username, setUsername] = useState<string>();
  const controller = connectors[0] as ControllerConnector;

  useEffect(() => {
    if (!address) return;
    controller.username()?.then(setUsername);
  }, [address, controller]);

  const entityId = useEntityId(address ?? "0");

  useEntityQuery(
    new ToriiQueryBuilder()
      .withClause(
        KeysClause(
          [ModelsMapping.Position],
          [address ? addAddressPadding(address) : undefined],
          "FixedLen"
        ).build()
      )
      .includeHashedKeys()
  );

  const position = useModel(entityId as string, ModelsMapping.Position);

  const move = async (direction: Direction) => {
    if (!account) return;
    setPending(true);
    try {
      await client.actions.move(
        account,
        new CairoCustomEnum({ [direction]: {} })
      );
    } finally {
      setPending(false);
    }
  };

  if (!address) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h1 className="login-title">Dojo Starter</h1>
          <p className="login-tagline">Chart your path on-chain</p>
          <button className="btn-login" onClick={() => connect({ connector: controller })}>
            Enter the World
          </button>
          <div className="login-ornament">&#9674; &#9674; &#9674;</div>
        </div>
      </div>
    );
  }

  const x = position?.x ?? 0;
  const y = position?.y ?? 0;

  return (
    <>
      <header className="header">
        <span className="header-title">Dojo Starter</span>
        <div className="header-right">
          <span className="header-username">
            {username ?? `${address.slice(0, 6)}...${address.slice(-4)}`}
          </span>
          <button className="btn-logout" onClick={() => disconnect()}>Log out</button>
        </div>
      </header>
      <main className="main-content">
        <TileGrid x={x} y={y} />
        <CompassRose onMove={move} disabled={pending} />
        {pending && <span className="pending">Moving...</span>}
      </main>
    </>
  );
}

export default App;
