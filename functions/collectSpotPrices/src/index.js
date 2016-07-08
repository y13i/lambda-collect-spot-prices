import apexjs from 'apex.js';
import AWS    from 'aws-sdk';

import 'babel-polyfill';

export default apexjs(async (event, context) => {
  console.log({event, context});

  const region = event.region || process.env.AWS_REGION;
  const ec2    = new AWS.EC2({region});
  const s3     = new AWS.S3({region});

  const params = {
    StartTime: (new Date(new Date() - (event.offset || 3600000))),
  };

  const priceHistory = await (async () => {
    const data = [];
    let nextToken = null;

    do {
      const response = await ec2.describeSpotPriceHistory(Object.assign({
        NextToken: nextToken,
      }, params)).promise();

      nextToken = response.NextToken;

      console.log(`Data got: ${response.SpotPriceHistory.length}`);

      response.SpotPriceHistory.forEach(item => data.push(item));
    } while (nextToken !== null && nextToken !== '');

    console.log(`Data total: ${data.length}`);

    return data;
  })();

  const priceHistoryLines = [
    'InstanceType,ProductDescription,SpotPrice,Timestamp,AvailabilityZone',
  ];

  priceHistory.forEach(data => {
    priceHistoryLines.push(
      `${data.InstanceType},${data.ProductDescription},${data.SpotPrice},${data.Timestamp.toJSON()},${data.AvailabilityZone}`
    );
  });

  const priceHistoryCSV = priceHistoryLines.join('\n');

  const putObjectResults = await s3.putObject({
    Bucket:      event.bucket,
    Key:         `${new Date().getTime()}.csv`,
    Body:        priceHistoryCSV,
    ContentType: 'text/csv',
  }).promise();

  return {putObjectResults};
});
