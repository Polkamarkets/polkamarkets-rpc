import * as yup from 'yup';

export const executeSchema = yup.object({
  contract: yup
    .mixed()
    .oneOf(['predictionMarket', 'predictionMarketV2', 'predictionMarketV3', 'predictionMarketV3Manager', 'erc20', 'realitio', 'achievements', 'voting', 'arbitration', 'arbitrationProxy', 'fantasyERC20Contract'])
    .required('Contract is required!'),
  method: yup.string().required('Method is required!'),
  address: yup.string().required('Address is required!'),
  privateKey: yup.string().required('Private key is required!'),
});