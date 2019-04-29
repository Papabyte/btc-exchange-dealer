/*jslint node: true */
"use strict";

exports.bServeAsHub = false;
exports.bLight = true;

exports.storage = 'sqlite';


exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';
exports.deviceName = 'Obyte dealer';
exports.permanent_pairing_secret = '0000';

exports.bIgnoreUnpairRequests = true;
exports.bSingleAddress = false;
exports.KEYS_FILENAME = 'keys.json';

