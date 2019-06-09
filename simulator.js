require('dotenv').config();
const Gps103 = require('./gps103');
const net = require('net');
const fs = require('fs');

const serverPort = process.env.GPS103_SERVER_PORT || 64459;
const serverUrl = process.env.GPS103_SERVER_URL || 'localhost';
const transmitInt = process.env.LOCATION_INTERVAL * 1000 || 3333;
const logfilePath = process.env.LOGFILE_PATH || 'nuerburg_ring.json';
const logFile = fs.readFileSync(logfilePath);
let gpsLog = JSON.parse(logFile);

var socket = net.connect(serverPort, serverUrl, () => {
    let gps103 = new Gps103();
    console.log("connected");

    socket.on('error', (err) => {
        console.log('socket error', err);
    });

    socket.on('close', () => {
        console.log('socket closed');
        clearInterval(loopSenderInt);
    });

    // create timer to send data from the file in a loop
    loopSenderInt = setInterval(loopSenderCb, transmitInt, gpsLog, gps103, socket);
});

function loopSenderCb(logFile, gps, socket) {
    if (typeof loopSenderCb.i == 'undefined') {
        loopSenderCb.i = 0;
    }
    if (socket.destroyed) {
        clearInterval(loopSenderCb);
        return;
    }
    logFile[loopSenderCb.i].info = 'acc on';
    logFile[loopSenderCb.i].hasFix = true;
    logFile[loopSenderCb.i].speed *= 3.6; // m/s to km/h
    logFile[loopSenderCb.i].gpsTime = new Date().toISOString();
    logFile[loopSenderCb.i].fixTime = new Date().getTime() / 1000;

    socket.write(gps.encode(logFile[loopSenderCb.i]));
    console.log(`point[${loopSenderCb.i}]:`,
        gps.encode(logFile[loopSenderCb.i]).toString());

    if (loopSenderCb.i < logFile.length) {
        loopSenderCb.i++;
    } else {
        loopSenderCb.i = 0;
    }
}
