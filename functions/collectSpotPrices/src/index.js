import apexjs from 'apex.js';
import AWS    from 'aws-sdk';
import uuid   from 'node-uuid';

import 'babel-polyfill';

export default apexjs(async (event, context) => {
  console.log({event, context});

  const region = event.region || process.env.AWS_REGION;
  const ec2    = new AWS.EC2({region});
  const s3     = new AWS.S3({region});

  const params = {
    StartTime: (new Date(new Date().getTime() - (event.offset || 3600000))),
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

  const firstLine = [
    'UUIDv4',
    'SpotPrice',
    'InstanceType',
    'ProductDescription',
    'AvailabilityZone',
    'Time',
    'Timestamp',
    'Year',
    'Month',
    'Day',
    'DayOfWeek',
    'Hours',
    'Minutes',
    'Seconds',
    'Milliseconds',
  ].join(',');

  const priceHistoryLines = [
    firstLine,
  ];

  priceHistory.forEach(data => {
    priceHistoryLines.push(
      [
        uuid.v4(),
        data.SpotPrice,
        data.InstanceType,
        data.ProductDescription,
        data.AvailabilityZone,
        data.Timestamp.toJSON(),
        data.Timestamp.getTime(),
        data.Timestamp.getFullYear(),
        data.Timestamp.getMonth() + 1,
        data.Timestamp.getDate(),
        data.Timestamp.toString().match(/^[^\s]+/)[0],
        data.Timestamp.getHours(),
        data.Timestamp.getMinutes(),
        data.Timestamp.getSeconds(),
        data.Timestamp.getMilliseconds(),
      ].join(',')
    );
  });

  const priceHistoryCSV = priceHistoryLines.join('\n');

  const putObjectResults = await s3.putObject({
    Bucket:      event.bucket,
    Key:         `${event.objectPrefix}${new Date().getTime()}.csv`,
    Body:        priceHistoryCSV,
    ContentType: 'text/csv',
  }).promise();

  return {putObjectResults};
});
