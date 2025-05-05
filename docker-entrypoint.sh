#!/bin/bash

echo fs.inotify.max_user_watches=524288 | tee -a /etc/sysctl.conf
sysctl -p

npm i
npm run dev
