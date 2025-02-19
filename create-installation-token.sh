#!/usr/bin/env bash

# This script creates an installation token for a GitHub App.
#
# Usage:
#   ./create-installation-token.sh [--debug] --client-id <client_id> --pem-path <pem_file_path>
#
# Example:
#   ./create-installation-token.sh --client-id 1234567890 --pem-path ./path/to/private-key.pem
#
# ref: https://docs.github.com/ja/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app#example-using-bash-to-generate-a-jwt

set -o pipefail

debug=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --debug)
      debug=true
      shift
      ;;
    --client-id)
      client_id=$2
      shift 2
      ;;
    --pem-path)
      pem_path=$2
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [ "$debug" = true ]; then
  set -x
fi

if [ -z "$client_id" ] || [ -z "$pem_path" ]; then
  echo "Usage: $0 [--debug] --client-id <client_id> --pem-path <pem_file_path>"
  exit 1
fi

pem=$(cat "$pem_path")

now=$(date +%s)
iat=$((${now} - 60)) # Issues 60 seconds in the past
exp=$((${now} + 600)) # Expires 10 minutes in the future

b64enc() { openssl base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n'; }

header_json='{
    "typ":"JWT",
    "alg":"RS256"
}'
# Header encode
header=$( echo -n "${header_json}" | b64enc )

payload_json="{
    \"iat\":${iat},
    \"exp\":${exp},
    \"iss\":\"${client_id}\"
}"
# Payload encode
payload=$( echo -n "${payload_json}" | b64enc )

# Signature
header_payload="${header}"."${payload}"
signature=$(
    openssl dgst -sha256 -sign <(echo -n "${pem}") \
    <(echo -n "${header_payload}") | b64enc
)

# Create JWT
JWT="${header_payload}"."${signature}"

if [ "$debug" = true ]; then
  printf '%s\n' "JWT: $JWT"
fi

GITHUB_API_URL="https://api.github.com"
GITHUB_REPOSITORY='tanimon/gha-playground'

installation_response="$(curl --location --silent --request GET \
  --url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/installation" \
  --header "Accept: application/vnd.github+json" \
  --header "X-GitHub-Api-Version: 2022-11-28" \
  --header "Authorization: Bearer ${JWT}" \
  )"

if [ "$debug" = true ]; then
  echo "installation_response: ${installation_response}"
fi

installation_id="$(echo "${installation_response}" | jq -r '.id')"

if [ "$debug" = true ]; then
  echo "installation_id: ${installation_id}"
fi

token_response="$(curl --location --silent --request POST \
  --url "${GITHUB_API_URL}/app/installations/${installation_id}/access_tokens" \
  --header "Accept: application/vnd.github+json" \
  --header "X-GitHub-Api-Version: 2022-11-28" \
  --header "Authorization: Bearer ${JWT}" \
  )"

if [ "$debug" = true ]; then
  echo "token_response: ${token_response}"
fi

token="$(echo "${token_response}" | jq -r '.token')"

echo "${token}"
