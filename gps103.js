// get more info about the protocol from:
// https://www.traccar.org/protocols/
// https://dl.dropboxusercontent.com/s/4r372ek1yarknb8/GPRS%20data%20protocol.xls

module.exports = Gps103 = function () {
    this.msgBufferRaw = new Array();
    this.msgBuffer = new Array();
    this.imei = null;
}

// if multiple message are in the buffer, it will store them in msgBuffer
// the state of the last message will be represented in Gps103
Gps103.prototype.parse = function (msg) {
    this.msgBufferRaw.length = 0;
    this.msgBuffer.length = 0;
    let messages = msg.toString().split(';');
    let loginRegex = /\#\#,imei:(\d{15}),A$/;
    let heartbeatRegex = /^\d{15}$/;
    let alarmRegex = /^imei:\d{15}.*$/;

    messages.forEach(msg => {
        if (msg === '') {
            return;
        }
        this.msgBufferRaw.push(msg);
        let parsed = {};
        // login
        if (loginRegex.test(msg)) {
            var imei = loginRegex.exec(msg);
            parsed.imei = parseInt(imei[1]);
            parsed.responseMsg = 'LOAD';
            parsed.expectsResponse = true;
            parsed.event = { number: 0x01, string: 'login' };
        }

        // heartbeat
        if (heartbeatRegex.test(msg)) {
            parsed.responseMsg = 'ON';
            parsed.expectsResponse = true;
            parsed.event = { number: 0x02, string: 'heartbeat' };
        }

        // alarm message
        if (alarmRegex.test(msg)) {
            let data = msg.split(',');
            parsed.expectsResponse = false;
            parsed.imei = parseInt(data[0].split(':')[1]);
            parsed.info = data[1];
            parsed.gpsTime = getGpsTime(data[2]);
            parsed.fixTime = getFixTime(data[2], data[5]);
            parsed.notSure1 = data[3];
            parsed.hasFix = Boolean(getFixType(data[4]));
            parsed.lat = getLatitude(data[8], data[7]);
            parsed.lon = getLongitude(data[10], data[9]);
            parsed.speed = parseFloat(data[11]);
            if (parsed.hasFix) {
                parsed.course = parseInt(data[12].split(':')[0]);
            } else {
                parsed.course = NaN;
            }
            parsed.event = { number: 0x12, string: 'location' };
            parsed.responseMsg = null;
        }

        this.msgBuffer.push(parsed);
        Object.assign(this, parsed);
    });
}

function getGpsTime(dateStr) {
    return new Date(Date.UTC(
        parseInt(dateStr.slice(0, 2)) + 2000,
        parseInt(dateStr.slice(2, 4)) - 1,
        parseInt(dateStr.slice(4, 6)),
        parseInt(dateStr.slice(6, 8)),
        parseInt(dateStr.slice(8, 10)),
        parseInt(dateStr.slice(10, 12))
    ));
}

function getFixTime(dateStr, timeStr) {
    let date = new Date(Date.UTC(
        parseInt(dateStr.slice(0, 2)) + 2000,
        parseInt(dateStr.slice(2, 4)) - 1,
        parseInt(dateStr.slice(4, 6)),
        parseInt(timeStr.slice(0, 2)),
        parseInt(timeStr.slice(2, 4)),
        parseInt(timeStr.slice(4, 6))
    ));
    return date.getTime() / 1000;
}

function getFixType(fL) {
    if (fL === 'F') {
        return 1;
    }
    return 0;
}

function getLatitude(ns, data) {
    if (!(/N|S/.test(ns))) {
        return 0.0;
    }

    let dd = parseInt(data.slice(0, 2));
    let mm = parseFloat(data.slice(2));
    let lat = dd + (mm / 60);

    if (ns === 'S') {
        lat *= -1;
    }
    return parseFloat(lat.toFixed(8));
}

function getLongitude(ew, data) {
    if (!(/E|W/.test(ew))) {
        return 0.0;
    }

    let dd = parseInt(data.slice(0, 3));
    let mm = parseFloat(data.slice(3));
    let lat = dd + (mm / 60);

    if (ew === 'W') {
        lat *= -1;
    }
    return parseFloat(lat.toFixed(8));
}