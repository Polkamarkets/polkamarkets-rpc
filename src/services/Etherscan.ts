import axios from 'axios';

export class Etherscan {
  public baseUrl: string;
  public apiKey: string;
  public chainId: string;

  constructor(opts?: { chainId?: string }) {
    // v2 base URL is fixed
    this.baseUrl = 'https://api.etherscan.io/v2';
    // require API keys from env (shared, outside multichain config)
    if (!process.env.ETHERSCAN_API_KEY) throw('ETHERSCAN_API_KEY is not configured');
    const apiKeys = process.env.ETHERSCAN_API_KEY.split(',');
    this.apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    // chain id can be passed per-network, else from env
    this.chainId = (opts && opts.chainId) || process.env.ETHERSCAN_CHAIN_ID;
    if (!this.chainId) throw('ETHERSCAN_CHAIN_ID is not configured');
  }

  public async getEvents(contract, address, fromBlock, toBlock, eventName, filter) {
    let etherscanUrl = `${this.baseUrl}/api?module=logs&action=getLogs&apikey=${this.apiKey}&chainid=${this.chainId}`;
    etherscanUrl += `&address=${address}`;
    if (fromBlock) etherscanUrl += `&fromBlock=${fromBlock}`;
    if (toBlock) etherscanUrl += `&toBlock=${toBlock}`;

    const eventOptions = contract.getContract()._generateEventOptions(eventName, {
      filter,
      fromBlock,
      toBlock,
    });

    // adding topics to query string
    eventOptions.params.topics.forEach((topic, index) => {
      if (topic) {
        etherscanUrl += `&topic${index}=${topic}`;
      }
    });

    // trying to fetch data from etherscan with 5 attempts
    let data;
    const attempts = 5;

    for (let i = 0; i < attempts; i++) {
      try {
        console.log(`Etherscan :: Fetching events from ${etherscanUrl}`);
        ({ data } = await axios.get(etherscanUrl));
        // error fetching data
        if (data.status === '0' && data.message !== 'No records found') throw (data.result);

        break;
      } catch (err) {
        // 0.2s cooldown
        await new Promise(resolve => setTimeout(resolve, 250));
        console.log(`Etherscan :: Error fetching events from ${etherscanUrl}`);
        if (i === attempts - 1) {
          throw err;
        }
      }
    }

    // hit etherscan result limit
    const maxLimitReached = data.result.length >= 1000;

    const events = data.result.map (result => {
      const decodedData = contract.web3.eth.abi.decodeLog(
        eventOptions.event.inputs,
        result.data,
        result.topics.slice(1) // first topic (eventName) is removed from array
      );

      return this.mapEvent(result, decodedData, eventName);
    }).sort((a, b) => a.blockNumber - b.blockNumber);

    return {
      result: events,
      maxLimitReached,
    };
  }

  private mapEvent(data, decodedData, eventName) {
    return {
      address: data.address,
      blockHash: '',
      blockNumber: parseInt(data.blockNumber),
      logIndex: parseInt(data.logIndex),
      removed: false,
      transactionHash: data.transactionHash,
      transactionIndex: parseInt(data.transactionIndex),
      transactionLogIndex: data.transactionIndex,
      id: '',
      returnValues: decodedData,
      event: eventName,
      signature: data.topics[0],
      raw: {
        data: data.data,
        topics: data.topics
      }
    };
  }
}
