"use strict";

//// SETUP //////

const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const request = require('request');

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'techStudio2';

// include / require the HTTP server and store it in a variable
const http = require('http');

// Port where we'll run the websocket server
const PORT = process.env.PORT || 1338;

// create instance of an Express app
const app = express();

// tell Express to serve files from root directory
app.use(express.static(__dirname + '/'));

// create the HTTP Express server
const server = http.createServer(app);

// websocket and http servers
var webSocketServer = require('websocket').server;

/* 
GLOBAL VARIABLES
*/
var countTotal = 0;
var clients = [];
var colors = ["#FF3E96", "#BA55D3", "#AB82FF", "#4876FF", "#1E90FF", "#00BFFF", "#00E5EE", "#00C78C", "#00EE76", "#FFD700", "#FFC125", "#FFA500", "#FF9912", "#FF7F00", "#FF6103", "#FF4500", "#FF6347", "#FF6A6A", "#FF0000"];

/**
 * HTTP server
 */

server.listen(PORT, () => console.log(`Listening on ${ PORT }`));

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    httpServer: server
});


// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    var connection = request.accept(null, request.origin); 
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    connection.index = index;

    var clientColor = colors[Math.floor(Math.random()*colors.length)];
    connection.sendUTF(JSON.stringify( { type: 'color', data: clientColor} ));

    console.log((new Date()) + ' Connection accepted.');

    // send back count countTotal
    if (countTotal > 0) {
        connection.sendUTF(JSON.stringify( { type: 'count', data: countTotal} ));
    }

    // user successfully answered riddle
    connection.on('message', function(input) {
         var obj = {
                'end': {x: 250 - Math.random()*500, y: Math.random()*500, z: 250 - Math.random()*500},
                'color': clientColor
            }

        if (input.utf8Data != 'false') { //correctly answered riddle
            obj.drop = false;
            obj.shape = input.utf8Data,
            countTotal++;
            obj.count = countTotal;
          
        } else { //incorrectly answered riddle 
            obj.drop = true;
            obj.count = countTotal;
        }

        var json = JSON.stringify({ type:'newSphere', data: obj });
        for (var i=0; i < clients.length; i++) {
            clients[i].sendUTF(json);
            console.log(clients[i].index, "connection: " + clients[i].connected); //for debugging
        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        console.log((new Date()) + " Peer "
            + connection.remoteAddress + " disconnected.");
        // remove user from the list of connected clients
        // clients.splice(index, 1);
        for (var i=0; i < clients.length; i++) {
            if ( clients[i].connected == false ){
                clients.splice(i, 1);
                for (var j = i; j < clients.length; j++){
                    clients[j].index--;
                }
                return;
            }
        }
        console.log('connection closed')
    });

});