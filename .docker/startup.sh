# in a container environment, we may need to determine the INSTANCE_IP
# for each container so that uploads are working even if load-balanced in a group
[ -z $INSTANCE_IP ] && $(hostname -i) node main.js || node main.js