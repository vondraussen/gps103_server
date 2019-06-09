require('dotenv').config();
const Gps103 = require('./gps103');
const Mqtt = require('mqtt');
const net = require('net');
const fs = require('fs');

const serverPort = process.env.GPS103_SERVER_PORT || 64459;
const rootTopic = process.env.MQTT_ROOT_TOPIC || 'gps103';
const brokerUrl = process.env.MQTT_BROKER_URL || 'localhost';
const brokerPort = process.env.MQTT_BROKER_PORT || 1883;
const mqttProtocol = process.env.MQTT_BROKER_PROTO || 'mqtt';
const brokerUser = process.env.MQTT_BROKER_USER || 'user';
const brokerPasswd = process.env.MQTT_BROKER_PASSWD || 'passwd';
const trustedCaPath = process.env.MQTT_BROKER_CA || '';
const TRUSTED_CA = fs.readFileSync(trustedCaPath);

var mqttClient = Mqtt.connect(
    {
        host: brokerUrl,
        port: brokerPort,
        protocol: mqttProtocol,
        ca: TRUSTED_CA,
        username: brokerUser,
        password: brokerPasswd
    }
);

mqttClient.on('error', (err) => {
    console.error('MQTT Error:', err);
});

var server = net.createServer((client) => {
    var gps103 = new Gps103();
    console.log('client connected');

    server.on('error', (err) => {
        console.error('server error', err);
    });

    client.on('error', (err) => {
        console.error('client error', err);
    });

    client.on('close', () => {
        console.log('client disconnected');
    });

    client.on('data', (data) => {
        try {
            gps103.parse(data);
        }
        catch (e) {
            console.log('err', e);
            return;
        }
        console.log(gps103);
        if (gps103.expectsResponse) {
            client.write(gps103.responseMsg);
        }
        mqttClient.publish(rootTopic + '/' + gps103.imei + '/pos', JSON.stringify(gps103));
    });
});

server.listen(serverPort, () => {
    console.log('started server on port:', serverPort);
});

