# Gps103 Server
This is a Gps103 GPS Tracker server implementation  written in javascript.
It parses all messages received from the device and creates the response message, if needed.
Eventually it will send the received information to an MQTT broker.

So it acts as a server for Gps103 trackers and a gateway to MQTT.

## Configuration
The following environment variables are recognized. If not defined a default will be used.
- Gps103_SERVER_PORT=64459
- MQTT_ROOT_TOPIC=gps103
- MQTT_BROKER_URL=localhost
- MQTT_BROKER_PORT=1883
- MQTT_BROKER_PROTO=mqtt
- MQTT_BROKER_CA=/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem
- MQTT_BROKER_USER=user
- MQTT_BROKER_PASSWD=passwd

## MQTT
Messages received on the TCP port will be transmitted via MQTT *MQTT_ROOT_TOPIC/IMEI/pos*

For example: *gps103/123456789012345/pos*
