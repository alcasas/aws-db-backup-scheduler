import { SNS } from 'aws-sdk';

const aswConf = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: process.env.REGION
};

export const publishSNS = (error: Error, callback?) => {
  const errorDisplay = error.name ? error.name : 'Error';
  const errorMsgDisplay = error.message ? error.message : 'Unexpected error.';
  if (error) {
    if (process.env.SUBSCRIPTION_EMAIL !== 'none') {
      const sns = new SNS(aswConf);
      sns.publish({
        TopicArn: process.env.SNS_ERROR_ARN,
        Message: `${errorDisplay}: ${errorMsgDisplay}. Please go to you AWS account and look for lambda logs or contact your administrator.`,
        Subject: `Error in service ${process.env.SERVICE_NAME}.`,
      }, () => {
        if(callback){
          callback(error);
        }
      });
    } else {
      if(callback){
        callback(error);
      }
    }
  } else {
    if(callback){
      callback();
    }
  }
};