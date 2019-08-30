# in a container environment, we may need to determine the INSTANCE_IP
# for each container so that uploads are working even if load-balanced in a group
if [ -z $INSTANCE_IP ]
then 
    export INSTANCE_IP=$(hostname -i) 
fi

if [ -z $INSTANCE_IP ]
then 
    export INSTANCE_IP=$(curl http://169.254.169.254/latest/meta-data/local-ipv4 --connect-timeout 2) 
fi

node main.js