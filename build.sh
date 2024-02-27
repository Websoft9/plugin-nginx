#!/bin/bash
cd /data/plugin-cockpit/plugin-nginx/build
yarn build
while [ ! -d "/usr/share/cockpit/nginx" ]; do
  sleep 1
done
cp -r ./* /usr/share/cockpit/nginx/