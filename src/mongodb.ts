import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3,  } from 'aws-sdk';
import { publishSNS } from './utilities';
import mongoDump from 'mongodb-backup-4x';
import s3UploadStream from 's3-upload-stream';
import 'source-map-support/register';

export const backup: APIGatewayProxyHandler = (_event, _context, callback) => {

  const {
    DB_URL,
    DB_USER,
    DB_PASS,
    DB_HOST,
    DB_PORT,
    DB_NAME,
    REGION,
    SERVICE_NAME,
    AWS_S3_DUMP_BUCKET,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_SESSION_TOKEN
  } = process.env;

  const port = DB_PORT !== '' ? DB_PORT : 27017;

  const uri = DB_URL !== '' ? DB_URL : `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:${port}/${DB_NAME}`;

  const handleError : Function = (error: Error)=>{
    publishSNS(error, callback);
  }

  const s3Stream = s3UploadStream(new S3({
    accessKeyId     : AWS_ACCESS_KEY_ID,
    secretAccessKey : AWS_SECRET_ACCESS_KEY,
    sessionToken    : AWS_SESSION_TOKEN,
    region          : REGION
  }));

  const uploadToS3 = s3Stream.upload({
    Bucket: AWS_S3_DUMP_BUCKET,
    Key   : `${SERVICE_NAME}-${new Date().toISOString()}.tar`
  });

  uploadToS3.on('error', handleError);
  uploadToS3.on('uploaded', (body: Object)=>{
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(body)
    });
  });

  mongoDump({
    uri,
    root    : __dirname,
    metadata: true,
    stream  : uploadToS3,
    options : {
      useNewUrlParser: true
    },
    callback: handleError
  });

}
