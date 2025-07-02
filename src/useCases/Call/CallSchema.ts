import * as yup from 'yup';

export const callSchema = yup.object({
  contract: yup
    .mixed()
    .oneOf(['predictionMarket', 'predictionMarketV2', 'predictionMarketV3', 'predictionMarketV3_2', 'predictionMarketV3Manager', 'predictionMarketV3Controller', 'predictionMarketV3Querier', 'erc20', 'realitio', 'achievements', 'voting', 'arbitration', 'arbitrationProxy'])
    .required('Contract is required!'),
  method: yup.string().required('Method is required!'),
  address: yup.string().required('Address is required!')
});
