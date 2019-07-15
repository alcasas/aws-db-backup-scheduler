import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { publishSNS } from './utilities';
import { readFileSync, unlinkSync } from 'fs';
import mysqldump from 'mysqldump';
import 'source-map-support/register';

export const backup: APIGatewayProxyHandler = async(_event, _context) => {

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
  
  let database = DB_NAME;
  let host = DB_HOST;
  let port = DB_PORT !== '' ? DB_PORT : '3306';
  const fileName = `${SERVICE_NAME}-${new Date().toISOString()}.sql`;
  const fileilePath = `/tmp/${fileName}`;

  if(DB_URL !== ''){
    let dbUrl = DB_URL.replace('mysql://','');
    let dbParts = dbUrl.split('/');
    database = dbParts[1];
    let hostParts = dbParts[0].split(':');
    port = hostParts[1] ? hostParts[1] : port;
    host = hostParts[0] ? hostParts[0] : port;
  }

  try{
    await mysqldump({
      connection: {
        database,
        host,
        user    : DB_USER,
        password: DB_PASS,
        port    : Number(port)
      },
      dumpToFile: fileilePath
    });

    const dumpData = readFileSync(fileilePath);
  
    return new Promise<APIGatewayProxyResult>((resolve, reject)=>{

      const s3 = new S3({
        accessKeyId     : AWS_ACCESS_KEY_ID,
        secretAccessKey : AWS_SECRET_ACCESS_KEY,
        sessionToken    : AWS_SESSION_TOKEN,
        region          : REGION
      });

      s3.putObject({
        Body  : dumpData,
        Bucket: AWS_S3_DUMP_BUCKET,
        Key   : fileName
      }, (error, data)=>{
        unlinkSync(fileilePath);
        if(error){
          publishSNS(error, ()=>{
            reject({
              statusCode: 500,
              body: JSON.stringify(error)
            });
          });
        } else {
          resolve({
            statusCode: 200,
            body: JSON.stringify(data)
          });
        }
      });

    });
    
  } catch(error){
    return new Promise<APIGatewayProxyResult>((_resolve, reject)=>{
      publishSNS(error, ()=>{
        reject(error);
      });
    });
  }

}
