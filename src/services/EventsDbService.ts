import { db } from '@db/index';
import { events } from '@db/schema';
import { and, eq, max, sql } from 'drizzle-orm';

type GetPastEvents = (eventName: string, options: { filter: any, fromBlock: number | string, toBlock: number | string }) => Promise<any[]>;

export class EventsDbService {

  async queryAndTopUp(params: {
    contractName: string;
    contractAddress: string;
    eventName: string;
    topics: (string | null)[]; // [topic0, topic1, topic2, topic3]
    filter: any;
    getPastEvents: GetPastEvents;
    getBlockNumber: () => Promise<number>;
    fromBlock?: number;
    toBlock?: number;
    chunkSize?: number;
    networkId: number;
  }) {
    const { contractName, contractAddress, eventName, topics, filter, getPastEvents, getBlockNumber, fromBlock, toBlock, chunkSize, networkId } = params;

    // Query DB by topics
    const useDb = !!db;
    const dbEvents = useDb ? await this.queryByTopics({
      networkId,
      contractAddress,
      eventName,
      topic0: topics[0] || undefined,
      topic1: topics[1] || undefined,
      topic2: topics[2] || undefined,
      topic3: topics[3] || undefined,
      fromBlock,
      toBlock,
    }) : [];

    // Determine incremental start
    const maxDbBlock = useDb ? await this.getMaxBlockNumber(contractAddress, eventName, networkId) : null;
    const incrementalFrom = typeof maxDbBlock === 'number' ? maxDbBlock + 1 : (fromBlock ?? 0);
    const endBlock = (toBlock ?? 'latest') === 'latest' ? await getBlockNumber() : (toBlock as number);
    const maxChunk = Number(chunkSize || 1000);

    // Fetch and insert incrementally (unfiltered), filter for response per chunk
    const collectedNew: any[] = [];
    let current = incrementalFrom;
    while (current <= endBlock) {
      const to = Math.min(current + maxChunk - 1, endBlock);
      const chunk = await getPastEvents(eventName, { filter: {}, fromBlock: current, toBlock: to });
      if (!Array.isArray(chunk)) break;

      // Insert full event payloads in sub-batches to avoid Neon param size limits
      if (useDb && chunk.length) {
        const rows = chunk.map((e: any) => ({
          networkId,
          contractAddress: contractAddress.toLowerCase(),
          contractName,
          eventName,
          txHash: e.transactionHash,
          blockNumber: e.blockNumber,
          logIndex: e.logIndex,
          topic0: e.raw?.topics?.[0] || null,
          topic1: e.raw?.topics?.[1] || null,
          topic2: e.raw?.topics?.[2] || null,
          topic3: e.raw?.topics?.[3] || null,
          data: e,
        }));
        const batchSize = Number(process.env.EVENTS_DB_BATCH_SIZE || 100);
        for (let i = 0; i < rows.length; i += batchSize) {
          const slice = rows.slice(i, i + batchSize);
          await db.insert(events).values(slice).onConflictDoNothing({ target: [events.txHash, events.logIndex] });
        }
      }

      // Add only matching events to response (as raw event objects)
      const filteredChunk = this.filterByTopics(chunk, topics);
      if (filteredChunk.length) {
        collectedNew.push(...filteredChunk);
      }

      current = to + 1;
      if (process.env.EVENTS_RPC_CHUNK_DELAY_MS) {
        await new Promise(r => setTimeout(r, parseInt(process.env.EVENTS_RPC_CHUNK_DELAY_MS)));
      }
    }

    // Return combined as raw events, sorted by blockNumber
    const combinedEvents = (dbEvents as any[]).map((r: any) => r.data).concat(collectedNew);
    return combinedEvents.sort((a: any, b: any) => a.blockNumber - b.blockNumber);
  }

  // keep helper to filter fetched events by topics

  private filterByTopics(fetched: any[], topics: (string | null)[]) {
    if (!topics || topics.length === 0) return fetched;
    return fetched.filter(ev => {
      const evTopics = (ev.raw && ev.raw.topics) || [];
      for (let i = 0; i < 4; i++) {
        const t = topics[i];
        if (!t) continue;
        if (!evTopics[i]) return false;
        if (String(evTopics[i]).toLowerCase() !== String(t).toLowerCase()) return false;
      }
      return true;
    });
  }

  private async getMaxBlockNumber(contractAddress: string, eventName?: string, networkId?: number): Promise<number | null> {
    const rows = await db!
      .select({ maxBlock: max(events.blockNumber) })
      .from(events)
      .where(
        eventName
          ? and(eq(events.networkId, networkId as number), eq(events.contractAddress, contractAddress.toLowerCase()), eq(events.eventName, eventName))
          : and(eq(events.networkId, networkId as number), eq(events.contractAddress, contractAddress.toLowerCase()))
      );
    return (rows?.[0]?.maxBlock as unknown as number | null) ?? null;
  }

  private async queryByTopics(params: {
    networkId: number;
    contractAddress: string;
    eventName?: string;
    topic0?: string;
    topic1?: string;
    topic2?: string;
    topic3?: string;
    fromBlock?: number;
    toBlock?: number;
    limit?: number;
  }) {
    const { networkId, contractAddress, eventName, topic0, topic1, topic2, topic3, fromBlock, toBlock, limit } = params;
    const conditions = [eq(events.networkId, networkId), eq(events.contractAddress, contractAddress.toLowerCase())] as any[];
    if (eventName) conditions.push(eq(events.eventName, eventName));
    if (topic0) conditions.push(eq(events.topic0, topic0.toLowerCase()));
    if (topic1) conditions.push(eq(events.topic1, topic1.toLowerCase()));
    if (topic2) conditions.push(eq(events.topic2, topic2.toLowerCase()));
    if (topic3) conditions.push(eq(events.topic3, topic3.toLowerCase()));
    if (typeof fromBlock === 'number') conditions.push(sql`${events.blockNumber} >= ${fromBlock}`);
    if (typeof toBlock === 'number') conditions.push(sql`${events.blockNumber} <= ${toBlock}`);

    const rows = await db!
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.blockNumber)
      .limit(limit || 10000);

    return rows;
  }
}
