export type PersistentEventConfig = {
  contract: string;
  event: string;
  // optional list of indexed arg names to index (e.g., ["user", "marketId"]).
  indexedArgs?: string[];
};

// Configure heavy events that should be persisted and indexed.
// Example:
// { contract: 'predictionMarketV3', event: 'MarketActionTx', indexedArgs: ['user'] }
export const PERSISTENT_EVENTS: PersistentEventConfig[] = (
  process.env.PERSISTENT_EVENTS
    ? JSON.parse(process.env.PERSISTENT_EVENTS)
    : []
);

export function isPersistentEvent(contract: string, event: string): boolean {
  return PERSISTENT_EVENTS.some(
    e => e.contract === contract && e.event === event
  );
}

export function getIndexedArgs(contract: string, event: string): string[] {
  const found = PERSISTENT_EVENTS.find(e => e.contract === contract && e.event === event);
  return found && found.indexedArgs ? found.indexedArgs : [];
}
