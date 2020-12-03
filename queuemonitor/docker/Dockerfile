FROM node:14.13.1
RUN mkdir /usr/local/quemonservice
COPY run.sh /usr/local/quemonservice/run.sh
COPY index.js /usr/local/quemonservice/index.js
COPY package.json /usr/local/quemonservice/package.json
COPY general /usr/local/quemonservice/general
COPY models /usr/local/quemonservice/models
COPY proxies /usr/local/quemonservice/proxies
COPY services /usr/local/quemonservice/services
COPY notifications /usr/local/quemonservice/notifications
COPY controllers /usr/local/quemonservice/controllers
COPY middleware /usr/local/quemonservice/middleware
COPY public /usr/local/quemonservice/public
COPY db /usr/local/quemonservice/db
RUN cd /usr/local/quemonservice && npm i
CMD sh /usr/local/quemonservice/run.sh