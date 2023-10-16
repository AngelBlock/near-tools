#!/bin/bash

output_file="output.txt"
json_result=$(curl -s -d '{
    "jsonrpc": "2.0",
    "id": "dontcare",
    "method": "network_info",
    "params": {}
}' -H 'Content-Type: application/json' http://localhost:3030)

echo "Timestamp: $(date)" >> $output_file
peer_count=$(echo $json_result | jq '.result.active_peers | length')
validator_count=0
while read -r active_peer; do
    peer_id=$(echo $active_peer | jq -r '.id')
    addr=$(echo $active_peer | jq -r '.addr')
    account_id=$(echo $json_result | jq -r --arg peer_id "$peer_id" '.result.known_producers[] | select(.peer_id == $peer_id) | .account_id')
    if [[ ! -z "$account_id" && "$account_id" != "null" ]]; then
        echo "$peer_id - $account_id - $addr" >> $output_file
        validator_count=$((validator_count + 1))
    fi
done < <(echo $json_result | jq -c '.result.active_peers[]')

echo $validator_count
echo "Total active peers: $peer_count" >> $output_file
echo "Total active validator peers: $validator_count" >> $output_file
echo "--------------------------------------------------" >> $output_file
echo "Displayed"
