#!/usr/bin/env bash

function parse_git_hash(){
  git rev-parse --short HEAD 2> /dev/null | sed "s/\(.*\)/\1/"
}

# Install AWS-CLI - if it's there, this will be done quickly
sudo apt-get -y -qq update
sudo apt-get -y -qq install python3
curl -O https://bootstrap.pypa.io/get-pip.py
python3 get-pip.py --user
export PATH=~/.local/bin:$PATH
pip install awscli --upgrade --user

# we want this script to work with Travis and CircleCi, so abstract the Environment variables
export BRANCH=${TRAVIS_BRANCH}${CIRCLE_BRANCH}
export COMMIT=${TRAVIS_COMMIT}${CIRCLE_SHA1} #will return the long sha which is too long to be readable
export COMMIT_SHORT=$(parse_git_hash) # ${TRAVIS_COMMIT}${CIRCLE_SHA1} will return the long sha which is too long to be readable
export BUILD_FILE=Assistify_Chat_${BRANCH/\//_}_${COMMIT_SHORT}.tar.gz # replace slashes from the branch name (e. g. "feature/...")
export DEPLOY_PATH=/tmp/build/

export NODEJS_VERSION="8.11.4"
export NODEJS_CHECKSUM="c69abe770f002a7415bd00f7ea13b086650c1dd925ef0c3bf8de90eabecc8790"

# in Circle-Ci, the containers already got a aws-config, so if it exsists, assume it's ok
if [ ! -f ~/.aws/credentials ]
  then
    mkdir -p ~/.aws
    echo "Creating AWS credentials from environment variables"
    echo "[default]
      aws_access_key_id = ${AWS_ACCESS_KEY}
      aws_secret_access_key = ${AWS_SECRET_KEY}" > ~/.aws/credentials
fi

# store the build artifact
cd ${DEPLOY_PATH}
mv Rocket.Chat.tar.gz ${BUILD_FILE}
aws s3 cp ${BUILD_FILE} s3://${AWS_BUCKET}/rocketchat/ --region ${AWS_REGION} --acl bucket-owner-full-control

# For dedicated branches, we tag the artifacts - this should actually be based on git tags
TARGET_ENVIRONMENT_TAG="undefined"
DEPLOYMENT_TARGET_ENVIRONMENT=""
if [ ${BRANCH} = master ]
	then
      TARGET_ENVIRONMENT_TAG="production"
      DEPLOYMENT_TARGET_ENVIRONMENT="prd"
      IMAGE_TAG="latest"

      # publish a new "latest"-file in order to make new clients be created with it
      aws s3 cp ${BUILD_FILE} s3://${AWS_BUCKET}/rocketchat/rocket-chat-latest.tar.tgz --region ${AWS_REGION} --acl bucket-owner-full-control

else
  if [[ ${BRANCH} == develop ]]
      then
        TARGET_ENVIRONMENT_TAG="test"
        DEPLOYMENT_TARGET_ENVIRONMENT="iat"
        IMAGE_TAG="develop"
  fi
fi

aws s3api put-object-tagging --region ${AWS_REGION} --bucket ${AWS_BUCKET} --key rocketchat/${BUILD_FILE} --tagging "{ \"TagSet\": [ { \"Key\": \"environment\", \"Value\": \"${TARGET_ENVIRONMENT_TAG}\" }, { \"Key\": \"nodejs_version\", \"Value\": \"${NODEJS_VERSION}\" }, { \"Key\": \"nodejs_checksum\", \"Value\": \"${NODEJS_CHECKSUM}\" }, { \"Key\": \"assets\", \"Value\": \"${ASSETS_URL}\" } ] }"

# Notify the Lambda triggering our cluster deployment

[[ ! -z "$DEPLOYMENT_TARGET_ENVIRONMENT" ]] && curl -X POST ${DEPLOYMENT_URL} -H "accept: application/json" -H "TOKEN: ${DEPLOYMENT_API_KEY}" -H "Content-Type: application/json" -d "{\"gitlab_token\":\"${DEPLOYMENT_GITLAB_TOKEN}\",\"target_environment\":\"${DEPLOYMENT_TARGET_ENVIRONMENT}\",\"image_tag\":\"${IMAGE_TAG}\"}"