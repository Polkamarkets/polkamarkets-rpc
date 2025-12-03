import { pgTable, bigserial, text, bigint, integer, jsonb, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  networkId: integer('network_id').notNull(),
  contractAddress: text('contract_address').notNull(),
  contractName: text('contract_name').notNull(),
  eventName: text('event_name').notNull(),
  txHash: text('tx_hash').notNull(),
  blockNumber: bigint('block_number', { mode: 'number' }).notNull(),
  logIndex: integer('log_index').notNull(),
  topic0: text('topic0'),
  topic1: text('topic1'),
  topic2: text('topic2'),
  topic3: text('topic3'),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    txLogUnique: uniqueIndex('events_tx_log_unique').on(table.txHash, table.logIndex),
    byContractEventBlock: index('idx_events_contract_event_block').on(table.contractAddress, table.eventName, table.blockNumber),
    byTopic0: index('idx_events_topic0').on(table.topic0),
    byTopic1: index('idx_events_topic1').on(table.topic1),
    byTopic2: index('idx_events_topic2').on(table.topic2),
    byTopic3: index('idx_events_topic3').on(table.topic3),
    byBlockNumber: index('idx_events_block_number').on(table.blockNumber),
    byTxHash: index('idx_events_tx_hash').on(table.txHash),
    // Multichain composite indexes
    byNetworkContractEventBlock: index('idx_events_network_contract_event_block').on(table.networkId, table.contractAddress, table.eventName, table.blockNumber),
    byNetworkTopic0: index('idx_events_network_topic0').on(table.networkId, table.topic0),
    byNetworkTopic1: index('idx_events_network_topic1').on(table.networkId, table.topic1),
    byNetworkTopic2: index('idx_events_network_topic2').on(table.networkId, table.topic2),
    byNetworkTopic3: index('idx_events_network_topic3').on(table.networkId, table.topic3),
    byNetworkBlockNumber: index('idx_events_network_block_number').on(table.networkId, table.blockNumber),
  };
});
