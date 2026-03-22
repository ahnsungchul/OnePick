#!/bin/bash
echo "Initializing LocalStack S3 resources..."

# Create onepick-storage bucket
awslocal s3 mb s3://onepick-storage
awslocal s3api put-bucket-acl --bucket onepick-storage --acl public-read

# Create platform-assets bucket
awslocal s3 mb s3://platform-assets

# Make bucket publicly readable for CloudFront-like access
awslocal s3api put-bucket-acl --bucket platform-assets --acl public-read

echo "LocalStack S3 initialization complete."
