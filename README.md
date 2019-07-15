# AWS DB Backup Scheduler
This project is a [Serverless](https://serverless.com/) template that enhance auto-backup for databases.

It creates a CloudWatch Scheduler that triggers a lambda function, then the lambda function connects with the database, creates the dump file and finally upload it to S3.
S3 bucket includes lifecycle with Glacier transition (7 days as default) and expiration date (180 days as default)
It also creates a new SNS topic for error handling then you can subscribe to it.

## Using the template
Note: you must have Serverless installed.
1. Create your new serverless project using this template url

	    sls install --url https://github.com/alcasas/aws-db-backup-scheduler --name my-db-backup
	`--name` Is used for your service name

2. Install dependencies

	    yarn install
	or
	
		npm install
3. Deploy the stack to AWS

	    sls deploy --db-url "yourDBurl" --db-manager nameOfDBManager --bucket your-dump-bucket --email your@mail.com

## Deploy options

 - `--db-user` : DB username for authentication
 - `--db-pass` : DB password for authentication
 - `--db-name` : DB name to connect with
 - `--db-host` : DB hostname to connect with
 - `--db-port` : DB port to connect with
 - `--db-url` : Is the DB url to connect  with (url will have priority over another options)
 - `--db-manager` : Is the manager of the db, currently supported: mongodb, mysql (mongodb by default)
 - `--bucket`: Is the bucket where dumps will be saved (required)
	 - Remember that bucket name must be unique in AWS (globally)
 - `--email` : Is the email used to create a new subscription (optional)
 - `--profile`: If you have more than one aws profile in your system you can choose (this is serverless option and not required)
 - `--region`: Region where resources will be created (not required us-west-2 by default)

## Examples

For mongodb (better to use db-url)

    sls deploy --db-manager mongodb --db-url "mongodb://<mongoDBUser>:mongoDBPassword@cluster-shard-00-00-rumzw.mongodb.net:27017,cluster-shard-00-01-rumzw.mongodb.net:27017,cluster-shard-00-02-rumzw.mongodb.net:27017/cluster?ssl=true&replicaSet=Cluster-shard-0&authSource=admin&retryWrites=true" --bucket my-db-backups --email my@email.com --profile MyLocalAWSProfile

For Mysql

	sls deploy --db-host myDomainHost.com --db-name my_tenant_db --db-user my_tenant_user --db-pass SuperSecret --db-manager mysql --email my@mail.com --profile MyLocalAWSProfile --bucket my-db-backups

## Additional changes
in `serverless.yml` file you can change whatever you want

 - Schedule time
 - Lambda memory and timeout
 - Expiration date for dump files
 - Transition time for Glacier
 - Even if you already have a bucket you can modify the file to point to your existing bucket

## Resources
In your AWS account you'll see this new resources

 - Lambda function for database backup | AWS::Lambda::Function
 - Lambda log stream | AWS::Logs::LogGroup
 - New lambda version | AWS::Lambda::Version
 - Bucket for stack deployment | AWS::S3::Bucket
 - Your specified bucket, where dumps will be saved | AWS::S3::Bucket
 - IAM Role for the stack | AWS::IAM::Role
 - Schedule rule | AWS::Events::Rule
 - Schedule permissions | AWS::Lambda::Permission
 - SNS Topic for errors | AWS::SNS::Topic
 - If you specify an email for the error subscription then a new subscription will be created | AWS::SNS::Subscription (you have to accept the subscription in the given email)

## Extras 
 - Lambda uses node environment
 - Created from aws-nodejs-typescript template
 - `src` folder contains the backup handlers
 - [s3-upload-stream module](https://www.npmjs.com/package/s3-upload-stream)
 - [mongodb-backup-4x module](https://www.npmjs.com/package/mongodb-backup-4x)
 - [mysqldump module](https://www.npmjs.com/package/mysqldump)