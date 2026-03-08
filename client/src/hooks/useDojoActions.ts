/**
 * Hook that wraps Dojo contract actions (spawn, move, dig).
 * Uses DojoProvider from @dojoengine/core to submit transactions to the on-chain world.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { DojoProvider } from "@dojoengine/core";
import { CairoCustomEnum } from "starknet";
import { dojoConfig, RPC_URL } from "../dojo/config";
import { setupWorld } from "../dojo/contracts";

export interface DojoPlayerState {
  x: number;
  y: number;
  health: number;
  gold: number;
  level: number;
  best: number;
}

export interface UseDojoActionsReturn {
  /** Whether the Dojo provider is ready */
  ready: boolean;
  /** On-chain player state (updated after each action) */
  playerState: DojoPlayerState | null;
  /** Call spawn() on the Dojo world contract */
  spawn: () => void;
  /** Call move(direction) on the Dojo world contract */
  move: (direction: "Up" | "Down" | "Left" | "Right") => void;
  /** Call dig() on the Dojo world contract */
  dig: () => void;
  /** Whether a transaction is currently in flight */
  pending: boolean;
}

/** Map direction string to CairoCustomEnum for the Cairo Direction type */
function directionEnum(dir: "Up" | "Down" | "Left" | "Right"): CairoCustomEnum {
  return new CairoCustomEnum({
    Up: dir === "Up" ? {} : undefined,
    Down: dir === "Down" ? {} : undefined,
    Left: dir === "Left" ? {} : undefined,
    Right: dir === "Right" ? {} : undefined,
  });
}

export function useDojoActions(): UseDojoActionsReturn {
  const { account } = useAccount();
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [playerState, setPlayerState] = useState<DojoPlayerState | null>(null);
  const worldRef = useRef<ReturnType<typeof setupWorld> | null>(null);
  const spawnedRef = useRef(false);

  // Initialize DojoProvider and setup world
  useEffect(() => {
    try {
      const provider = new DojoProvider(dojoConfig.manifest, RPC_URL);
      worldRef.current = setupWorld(provider);
      setReady(true);
    } catch (err) {
      console.warn("[Dojo] Failed to initialize provider:", err);
    }
  }, []);

  const spawn = useCallback(() => {
    if (!account || !worldRef.current || spawnedRef.current) return;
    spawnedRef.current = true;
    setPending(true);
    worldRef.current.actions
      .spawn(account)
      .then(() => {
        console.log("[Dojo] spawn() tx submitted");
        setPlayerState({ x: 0, y: 0, health: 100, gold: 0, level: 1, best: 0 });
      })
      .catch((err) => {
        console.warn("[Dojo] spawn() failed:", err);
        spawnedRef.current = false;
      })
      .finally(() => setPending(false));
  }, [account]);

  const move = useCallback(
    (direction: "Up" | "Down" | "Left" | "Right") => {
      if (!account || !worldRef.current) return;
      const dir = directionEnum(direction);
      worldRef.current.actions
        .move(account, dir)
        .then(() => {
          setPlayerState((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            if (direction === "Up" && next.y > 0) next.y -= 1;
            if (direction === "Down" && next.y < 9) next.y += 1;
            if (direction === "Left" && next.x > 0) next.x -= 1;
            if (direction === "Right" && next.x < 9) next.x += 1;
            next.health = Math.max(0, next.health - 1);
            return next;
          });
        })
        .catch((err) => console.warn("[Dojo] move() failed:", err));
    },
    [account]
  );

  const dig = useCallback(() => {
    if (!account || !worldRef.current) return;
    worldRef.current.actions
      .dig(account)
      .then(() => {
        console.log("[Dojo] dig() tx submitted");
        // State update depends on chain outcome (gold or bomb)
        // Optimistically assume gold for display
        setPlayerState((prev) => {
          if (!prev) return prev;
          return { ...prev, gold: prev.gold + 10 };
        });
      })
      .catch((err) => console.warn("[Dojo] dig() failed:", err));
  }, [account]);

  return { ready, playerState, spawn, move, dig, pending };
}
