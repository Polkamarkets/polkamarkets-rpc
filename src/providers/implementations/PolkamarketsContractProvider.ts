import * as polkamarketsjs from 'polkamarkets-js';

import { ContractProvider } from '@providers/ContractProvider';
import { Etherscan } from '@services/Etherscan';
import { RedisService } from '@services/RedisService';

import { EventsWorker } from '@workers/EventsWorker';

export class PolkamarketsContractProvider implements ContractProvider {
  public polkamarkets: any;

  public web3Providers: Array<string>;

  public web3EventsProviders: Array<string>;

  public useEtherscan: boolean;

  public etherscanSkipWrite: boolean;

  public blockConfig: Object | undefined;

  public limitMessages: Array<string>;

  constructor() {
    // providers are comma separated
    this.web3Providers = process.env.WEB3_PROVIDER.split(',');
    this.web3EventsProviders = process.env.WEB3_EVENTS_PROVIDER ? process.env.WEB3_EVENTS_PROVIDER.split(',') : this.web3Providers;
    this.useEtherscan = !!(process.env.ETHERSCAN_URL && process.env.ETHERSCAN_API_KEY);
    this.etherscanSkipWrite = !!(process.env.ETHERSCAN_SKIP_WRITE);
    this.blockConfig = process.env.WEB3_PROVIDER_BLOCK_CONFIG ? JSON.parse(process.env.WEB3_PROVIDER_BLOCK_CONFIG) : null;
    this.limitMessages = [
      'logs matched by query exceeds limit of 10000',
      'Query returned more than 10000 results',
      '10,000',
      'Response is too big',
      // 'Returned error: service temporarily unavailable, retry in 10m0s'
    ];
  }

  public initializePolkamarkets(web3ProviderIndex: number, privateKey?: string, web3EventsProviderIndex?: number) {
    // picking up provider and starting polkamarkets
    if (privateKey) {
      this.polkamarkets = new polkamarketsjs.Application({
        web3Provider: web3EventsProviderIndex !== undefined
          ? this.web3EventsProviders[web3EventsProviderIndex]
          : this.web3Providers[web3ProviderIndex],
        web3PrivateKey: privateKey
      });
    } else {
      this.polkamarkets = new polkamarketsjs.Application({
        web3Provider: web3EventsProviderIndex !== undefined
          ? this.web3EventsProviders[web3EventsProviderIndex]
          : this.web3Providers[web3ProviderIndex]
      });
    }
    this.polkamarkets.start();
  }

  public getContract(contract: string, address: string, providerIndex: number, privateKey?: string, web3EventsProviderIndex?: number) {
    this.initializePolkamarkets(providerIndex, privateKey, web3EventsProviderIndex);

    if (contract === 'predictionMarket') {
      return this.polkamarkets.getPredictionMarketContract({ contractAddress: address });
    } else if (contract === 'predictionMarketV2') {
      return this.polkamarkets.getPredictionMarketV2Contract({ contractAddress: address });
    } else if (contract === 'predictionMarketV3') {
      return this.polkamarkets.getPredictionMarketV3Contract({ contractAddress: address });
    } else if (contract === 'predictionMarketV3_2' || contract === 'predictionMarketV3Plus') {
      return this.polkamarkets.getPredictionMarketV3PlusContract({ contractAddress: address });
    } else if (contract === 'predictionMarketV3Manager') {
      return this.polkamarkets.getPredictionMarketV3ManagerContract({ contractAddress: address });
    } else if (contract === 'predictionMarketV3Controller') {
      return this.polkamarkets.getPredictionMarketV3ControllerContract({ contractAddress: address });
    } else if (contract === 'predictionMarketV3Querier') {
      return this.polkamarkets.getPredictionMarketV3QuerierContract({ contractAddress: address });
    } else if (contract === 'erc20') {
      return this.polkamarkets.getERC20Contract({ contractAddress: address });
    } else if (contract === 'realitio') {
      return this.polkamarkets.getRealitioERC20Contract({ contractAddress: address });
    } else if (contract === 'achievements') {
      return this.polkamarkets.getAchievementsContract({ contractAddress: address });
    } else if (contract === 'voting') {
      return this.polkamarkets.getVotingContract({ contractAddress: address });
    } else if (contract === 'arbitration') {
      return this.polkamarkets.getArbitrationContract({ contractAddress: address });
    } else if (contract === 'arbitrationProxy') {
      return this.polkamarkets.getArbitrationProxyContract({ contractAddress: address });
    } else if (contract === 'fantasyERC20Contract') {
      return this.polkamarkets.getFantasyERC20Contract({ contractAddress: address });
    } else if (contract === 'merkleRewardsDistributor') {
      return this.polkamarkets.getMerkleRewardsDistributorContract({ contractAddress: address });
    } else {
      // this should never happen - should be overruled by the controller
      throw `'Contract ${contract} is not defined`;
    }
  }

  public async getBlockRanges(queryFromBlock, queryToBlock) {
    if (!this.blockConfig) {
      return [];
    }

    if (!this.polkamarkets) {
      this.initializePolkamarkets(0);
    }

    // iterating by block numbers
    let fromBlock = this.blockConfig['fromBlock'];
    const blockRanges = [];
    const currentBlockNumber = await this.polkamarkets.web3.eth.getBlockNumber();

    while (fromBlock < currentBlockNumber) {
      let toBlock = (fromBlock - fromBlock % this.blockConfig['blockCount']) + this.blockConfig['blockCount'];
      toBlock = toBlock > currentBlockNumber ? currentBlockNumber : toBlock;

      if (queryFromBlock && toBlock < queryFromBlock) {
        fromBlock = toBlock + 1;
        continue;
      }

      if (queryToBlock && queryToBlock !== 'latest' && fromBlock > queryToBlock) {
        break;
      }

      blockRanges.push({
        fromBlock,
        toBlock
      });

      fromBlock = toBlock + 1;
    }

    return blockRanges;
  }

  normalizeFilter(filter: Object): string {
    // sorting filter keys
    const keys = Object.keys(filter).sort();

    // normalizing filter
    const normalizedFilter = {};
    keys.forEach(key => {
      // ignoring item if not present
      if (!filter[key]) {
        return;
      }

      if (typeof filter[key] === 'string' && filter[key].startsWith('0x')) {
        // parsing as lowercase string in case it's a hexadecimal
        normalizedFilter[key] = filter[key].toString().toLowerCase();
      } else if (typeof filter[key] === 'string' && !isNaN(parseInt(filter[key]))) {
        // parsing string as integer in case it's a number
        normalizedFilter[key] = parseInt(filter[key]);
      } else {
        // storing string as downcase
        normalizedFilter[key] = filter[key].toString().toLowerCase();
      }
    });

    return JSON.stringify(normalizedFilter);
  }

  public blockRangeCacheKey(contract: string, address: string, eventName: string, filter: Object, blockRange: Object) {
    const blockRangeStr = `${blockRange['fromBlock']}-${blockRange['toBlock']}`;
    return `events:${contract}:${address.toLowerCase()}:${eventName}:${this.normalizeFilter(filter)}:${blockRangeStr}`;
  }

  public async getContractEvents(
    contract: string,
    address: string,
    providerIndex: number,
    eventName: string,
    filter: Object,
    fromBlock?: string,
    toBlock?: string
  ) {
    const polkamarketsContract = this.getContract(contract, address, providerIndex, undefined, providerIndex);
    this.blockConfig = process.env.WEB3_PROVIDER_BLOCK_CONFIG ? JSON.parse(process.env.WEB3_PROVIDER_BLOCK_CONFIG) : null;
    let etherscanData;

    const queryFromBlock = fromBlock || (this.blockConfig ? this.blockConfig['fromBlock'] : 0);
    const queryToBlock = toBlock || 'latest';

    if (!this.blockConfig || !this.blockConfig['blockCount'] || this.blockConfig['fallback']) {
      // no block config, querying directly in evm
      try {
        const events = await polkamarketsContract.getEvents(eventName, filter, queryFromBlock, queryToBlock);
        return events;
      } catch (err) {
        if (this.blockConfig && this.blockConfig['fallback'] && this.limitMessages.some(m => err.message.includes(m))) {
          // standard error limit reached, using fallback block fetcher
        } else {
          throw(err);
        }
      }
    }

    const readClient = new RedisService().client;

    if (this.useEtherscan) {
      try {
        etherscanData = await (new Etherscan().getEvents(polkamarketsContract, address, queryFromBlock, queryToBlock, eventName, filter));
      } catch (err) {
        // error fetching data from etherscan, taking RPC route
      }
    }

    // iterating by block numbers
    let events = [];
    let rpcError;
    const blockRanges = await this.getBlockRanges(queryFromBlock, queryToBlock);

    const keys = blockRanges.map((blockRange) => this.blockRangeCacheKey(contract, address, eventName, filter, blockRange));

    const response = await readClient.mget(...keys).catch(err => {
      console.log(err);
      readClient.end();
      throw(err);
    });

    // closing connection after request is finished
    readClient.end();

    // successful etherscan call
    if (etherscanData && !etherscanData.maxLimitReached) {
      if (!fromBlock && !toBlock && !this.etherscanSkipWrite) {
        // filling up empty redis slots
        const writeKeys: Array<[key: string, value: string]> = [];

        keys.forEach((key, index) => {
          const result = response[index];
          const fromBlock = parseInt(key.split(':').pop().split('-')[0]);
          const toBlock = parseInt(key.split(':').pop().split('-')[1]);

          if (!result && (toBlock % this.blockConfig['blockCount'] === 0)) {
            // key not stored in redis
            writeKeys.push([
              key,
              JSON.stringify(etherscanData.result.filter(e => e.blockNumber >= fromBlock && e.blockNumber <= toBlock))
            ]);
          }
        });

        if (writeKeys.length > 0 ) {
          const writeClient = new RedisService().client;

          // writing to redis (using N set calls instead of mset to set a ttl)
          await Promise.all(writeKeys.map(async (item) => {
            await writeClient.set(item[0], item[1], 'EX', 60 * 60 * 24 * 2).catch(err => {
              console.log(err);
              writeClient.end();
              throw(err);
            });
          }));

          writeClient.end();
        }
      }

      return etherscanData.result;
    }

    // filling up empty redis slots (only verifying for first provider)
    if (!process.env.DISABLE_QUEUES && providerIndex === 0 && response.slice(0, -1).filter(r => r === null).length > 1) {
      // some keys are not stored in redis, triggering backfill worker
      EventsWorker.send(
        {
          contract,
          address,
          eventName,
          filter
        }
      );
    }

    await Promise.all(blockRanges.map(async (blockRange, index) => {
      // checking redis if events are cached
      const result = response[index];
      let blockEvents;

      if (result) {
        blockEvents = JSON.parse(result);
      } else {
        try {
          blockEvents = await this.getBlockRangeEvents(
            polkamarketsContract,
            filter,
            eventName,
            blockRange.fromBlock,
            blockRange.toBlock
          );
        } catch (err) {
          // non-blocking, error will be thrown after all calls are performed
          rpcError = err;
          return;
        }

        // not writing to cache if block range is not complete
        if (blockRange.toBlock % this.blockConfig['blockCount'] === 0) {
          const writeClient = new RedisService().client;
          writeClient.nodeRedis.on("error", err => {
            // redis connection error, ignoring and letting the get/set functions error handlers act
            console.log("ERR :: Redis Connection: " + err);
            writeClient.end();
          });

          const key = this.blockRangeCacheKey(contract, address, eventName, filter, blockRange);
          await writeClient.set(key, JSON.stringify(blockEvents), 'EX', 60 * 60 * 24 * 2).catch(err => {
            console.log(err);
            writeClient.end();
            throw(err);
          });
          writeClient.end();
        }
      }

      events = blockEvents.concat(events);
    }));

    // if there's a RPC error, error is thrown after all calls are performed
    if (rpcError) throw(rpcError);

    return events.sort((a, b) => a.blockNumber - b.blockNumber);
  }

  public async getBlockRangeEvents(
    contract: any,
    filter: any,
    eventName: string,
    fromBlock: number,
    toBlock: number,
  ) {
    try {
      const events = await contract.getContract().getPastEvents(eventName, {
        filter,
        fromBlock,
        toBlock
      });

      if (!Array.isArray(events)) {
        // invalid response, throwing error
        const rpcError = events;
        throw rpcError;
      }

      return events;
    } catch (err) {
      if (this.limitMessages.some(m => err.message.includes(m))) {
        // splitting block range in half recursively
        const middleBlock = Math.floor((toBlock + fromBlock) / 2);
        const leftEvents = await this.getBlockRangeEvents(contract, filter, eventName, fromBlock, middleBlock);
        const rightEvents = await this.getBlockRangeEvents(contract, filter, eventName, middleBlock + 1, toBlock);

        return leftEvents.concat(rightEvents);
      }

      throw(err);
    }
  }
}
