#!/bin/sh

set -eu

readonly alias_name="local"
readonly endpoint="http://rustfs:9000"
readonly access_key="rustfsadmin"
readonly secret_key="rustfsadmin"
readonly bucket_name="writing-app-public-assets"

until mc alias set "$alias_name" "$endpoint" "$access_key" "$secret_key" >/dev/null 2>&1; do
  echo "Waiting for RustFS to accept S3 connections..."
  sleep 2
done

mc mb --ignore-existing "${alias_name}/${bucket_name}"
mc anonymous set download "${alias_name}/${bucket_name}"
