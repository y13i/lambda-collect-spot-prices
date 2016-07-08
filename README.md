# lambda-run-instances

This function run EC2 instances with given parameters (`event.runInstancesParams`).

## Usage

Deploy it (with [Apex](http://apex.run/), [S3 URL](https://s3-us-west-2.amazonaws.com/y13i-lambda/functions/launchInstances.zip) or manual upload) and invoke with event like below

```json
{
  "region": "ap-northeast-1",
  "runInstancesParams": {
    "InstanceType": "t2.nano"
  }
}
```
