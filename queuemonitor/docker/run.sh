echo "********************************************************"
echo "Starting QUEUEMON_SERVICE:  $GENESYS_CLIENT_ID";
echo "********************************************************"
cd /usr/local/quemonservice && GENESYS_CLIENT_ID=$GENESYS_CLIENT_ID GENESYS_CLIENT_SECRET=$GENESYS_CLIENT_SECRET DEBUG_LEVEL=$DEBUG_LEVEL node index.js
