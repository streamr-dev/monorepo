#!/bin/bash

VERSION=$1
FILE_NAME=package.json

if [[ "$1" == "" ]]; then
    echo 'usage: update-versions.sh <SEMVER>'
    exit 1
fi

PKG_DIRS="utils
test-utils
protocol
proto-rpc
autocertifier-client
dht
autocertifier-server
trackerless-network
client
cli-tools
broker"

PKG_NAMES="@streamr/utils
@streamr/test-utils
@streamr/protocol
@streamr/proto-rpc
@streamr/autocertifier-client
@streamr/dht
@streamr/autocertifier-server
@streamr/trackerless-network
streamr-client
@streamr/cli-tools
streamr-broker
"

# Update package versions
for pkg in $PKG_DIRS
do
    FILE_NAME=packages/$pkg/package.json
    TMP_FILE=$(mktemp)
    jq --arg versionNumber $VERSION '.version |= $versionNumber' $FILE_NAME > $TMP_FILE
    mv $TMP_FILE $FILE_NAME
    for PKG_NAME in $PKG_NAMES
    do
        jq --arg versionNumber $VERSION --arg PKG_NAME $PKG_NAME '
        if .dependencies[$PKG_NAME]? then .dependencies[$PKG_NAME] |= $versionNumber
        elif .devDependencies[$PKG_NAME]? then .devDependencies[$PKG_NAME] |= $versionNumber
        else . end' $FILE_NAME > $TMP_FILE
        mv $TMP_FILE $FILE_NAME
    done
done
