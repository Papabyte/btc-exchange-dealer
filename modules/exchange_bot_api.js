/*jslint node: true */
'use strict';

const db = require('ocore/db');
const correspondents = require('./correspondents.js');
const eventBus = require('ocore/event_bus.js');
const crypto = require('crypto');
const headlessWallet = require('headless-obyte');

const exchangeBotPairingCode = process.env.testnet ? "Al/xvPGCAZH8qYTn2hqeuiOIXDk9gIIyBMjPc23BDxh0@obyte.org/bb-test#0000" : "Ar2ukVqx309sX+LoC9RVOpfATgXskt+Ser5jVr3Q2FOo@obyte.org/bb#0000";
const timeOutInSec = 10;

var exchangeBotDeviceAddress;


function sellAt(price){
	var device = require('ocore/device.js');

	device.sendMessageToDevice(exchangeBotDeviceAddress,"object", {
		command: 'sell',
		price: price,
		time_limit: Math.floor(new Date() / 1000) + timeOutInSec,
		tag: crypto.randomBytes(10).toString('base64')
	})
}

function buyAt(price){
	var device = require('ocore/device.js');

	device.sendMessageToDevice(exchangeBotDeviceAddress,"object", {
		command: 'buy',
		price: price,
		time_limit: Math.floor(new Date() / 1000) + timeOutInSec,
		tag: crypto.randomBytes(10).toString('base64')
	})
}

eventBus.on('headless_wallet_ready', function() {

	/*
	 * Pair with btc-exchange bot if not already in correspondents list
	 */
	correspondents.findCorrespondentByPairingCode(exchangeBotPairingCode, (correspondent) => {
		if (!correspondent) {
			correspondents.addCorrespondent(exchangeBotPairingCode, 'Betting Bot', (err, device_address) => {
				if (err)
					throw new Error(err);
					exchangeBotDeviceAddress = device_address;
			});
		} else {
			exchangeBotDeviceAddress = correspondent.device_address;
		}
	});

});

exports.sellAt = sellAt;
exports.buyAt = buyAt;