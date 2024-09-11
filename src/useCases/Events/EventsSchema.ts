import * as yup from 'yup';

export const eventsSchema = yup.object({
  contract: yup
    .mixed()
    .oneOf(['predictionMarket', 'predictionMarketV2', 'predictionMarketV3', 'predictionMarketV3Manager', 'predictionMarketV3Controller', 'erc20', 'realitio', 'achievements', 'voting', 'arbitration', 'arbitrationProxy'])
    .required('Contract is required!'),
  eventName: yup.string().required('Event name is required!'),
  address: yup.string().required('Address is required!')
});
