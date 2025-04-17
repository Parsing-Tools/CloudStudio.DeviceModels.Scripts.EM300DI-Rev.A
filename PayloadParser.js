function parseUplink(device, payload) {
    var data = payload.asBytes();
    env.log('Data cruda en bytes: ', data);
    var decoded = milesightDeviceDecode(data);
    env.log('Data Decodificada: ', decoded);
    
    var e = device.endpoints.byAddress("1");
    if (e != null) {
      e.updateGenericSensorStatus(decoded.battery);
    }

    var e = device.endpoints.byAddress("2");
    if (e != null) {
      e.updateTemperatureSensorStatus(decoded.temperature);
    }

    var e = device.endpoints.byAddress("3");
    if (e != null) {
      e.updateHumiditySensorStatus(decoded.humidity);
    }

    var e = device.endpoints.byAddress("4");
    if (e != null) {
      e.updateGenericSensorStatus(decoded.water_conv);
    }

    var e = device.endpoints.byAddress("5");
    if (e != null) {
      e.updateGenericSensorStatus(decoded.pulse_conv);
    }

    var e = device.endpoints.byAddress("6");
    if (e != null) {
      e.updateGenericSensorStatus(decoded.water);
    }

    var e = device.endpoints.byAddress("7");
    if (e != null) {
      e.updateFlowSensorValueSummation(decoded.water);
    }

}

function milesightDeviceDecode(bytes) {
  var decoded = {};

  for (var i = 0; i < bytes.length; ) {
    var channel_id = bytes[i++];
    var channel_type = bytes[i++];

    // BATTERY
    if (channel_id === 0x01 && channel_type === 0x75) {
      decoded.battery = bytes[i];
      i += 1;
    }
    // TEMPERATURE
    else if (channel_id === 0x03 && channel_type === 0x67) {
      // ℃
      decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10;
      i += 2;
    }
    // HUMIDITY
    else if (channel_id === 0x04 && channel_type === 0x68) {
      decoded.humidity = bytes[i] / 2;
      i += 1;
    }
    // PULSE COUNTER
    else if (channel_id === 0x05 && channel_type === 0xe1) {
      decoded.water_conv = readUInt16LE(bytes.slice(i, i + 2)) / 10;
      decoded.pulse_conv = readUInt16LE(bytes.slice(i + 2, i + 4)) / 10;
      decoded.water = readFloatLE(bytes.slice(i + 4, i + 8));
      i += 8;
    } else {
      break;
    }
  }

  return decoded;
}

function readUInt16LE(bytes) {
  var value = (bytes[1] << 8) + bytes[0];
  return value & 0xffff;
}

function readInt16LE(bytes) {
  var ref = readUInt16LE(bytes);
  return ref > 0x7fff ? ref - 0x10000 : ref;
}

function readFloatLE(bytes) {
  // JavaScript bitwise operators yield a 32 bits integer, not a float.
  // Assume LSB (least significant byte first).
  var bits = (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
  var sign = bits >>> 31 === 0 ? 1.0 : -1.0;
  var e = (bits >>> 23) & 0xff;
  var m = e === 0 ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
  var f = sign * m * Math.pow(2, e - 150);

  var v = Number(f.toFixed(2));
  return v;
}
