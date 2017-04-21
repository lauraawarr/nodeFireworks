# nodeFireworks
A dual screen experience powered by NodeJS web sockets and THREEjs for the visual.

1. Clone this repo

2. In the command line, navigate to the cloned folder and install the required dependencies by running
```
npm install
```

3. Within front-end.js comment out line 63
```
const URL = "wss://" + window.location.hostname + ':' + PORT;
```
then uncomment line 65 and input your computers IP address
```
const URL = 'ws://< YOUR IP ADDRESS >:1337';
```
For example:
```
const URL = 'ws://192.168.0.60:1337';
```

4. In the command line, run the following to start a node server
```
node count-server.js
```

5. In a new command window, run the following to start a http server locally
```
sudo npm install http-server -g
http-server
```

6. Navigate to localhost:8080/
