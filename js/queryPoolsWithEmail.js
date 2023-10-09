const nearApi = require('near-api-js');

const NEAR_RPC_URL = 'https://rpc.mainnet.near.org';
const provider = new nearApi.providers.JsonRpcProvider({ url: NEAR_RPC_URL });

async function getValidatorsByBlockId(blockId = null) {
  return await provider.validators(blockId);
}

const getConfig = async () => {
  return {
    networkId: 'mainnet',
    nodeUrl: NEAR_RPC_URL,
    walletUrl: 'https://wallet.near.org',
    helperUrl: 'https://helper.near.org',
  };
};

const outputActiveValidators = async () => {
  try {
    const validators = await getValidatorsByBlockId(null);
    const currentValidators = validators["current_validators"];

    const lastBlock = await provider.block({ finality: 'final' });

    if (!lastBlock || !lastBlock.header) {
      throw new Error('Failed to retrieve valid block data.');
    }

    const pCurrent = await nearApi.validators.findSeatPrice(
      currentValidators,
      100,
      [1, 6250],
      lastBlock.header.latest_protocol_version
    );

    const activeValidators = currentValidators.filter(validator =>
      BigInt(validator.stake) >= pCurrent
    );

    const config = await getConfig();
    const keyStore = new nearApi.keyStores.InMemoryKeyStore();
    const near = await nearApi.connect({ ...config, deps: { keyStore } });
    const contractAccount = new nearApi.Account(near.connection, 'pool-details.near');
    const contract = new nearApi.Contract(contractAccount, 'pool-details.near', {
      viewMethods: ['get_all_fields'],
      changeMethods: [],
    });

    const poolDetails = await contract.get_all_fields({
      from_index: 0,
      limit: 300,
    });

    let emailCount = 0;
    const validatorsWithEmail = {};

    activeValidators.forEach((validator) => {
      const details = poolDetails[validator.account_id];
      if (details && details.email) {
        emailCount += 1;
        validatorsWithEmail[validator.account_id] = details.email;
      }
    });

    console.log("Validators with Emails:");
    console.log(validatorsWithEmail);
    console.log("\nTotal Validators with Emails: " + emailCount);
    console.log("Total Number of Active Validators: " + activeValidators.length);
  } catch (e) {
    console.log(e);
  }
};

outputActiveValidators();
