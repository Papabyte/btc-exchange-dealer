/*jslint node: true */
'use strict';

const correspondents = require('./correspondents.js');
const eventBus = require('ocore/event_bus.js');
const crypto = require('crypto');
const headlessWallet = require('headless-obyte');
const validationUtils = require("ocore/validation_utils.js");

const logger = require("./logger");

const exchangeBotPairingCode = process.env.testnet ? "Al/xvPGCAZH8qYTn2hqeuiOIXDk9gIIyBMjPc23BDxh0@obyte.org/bb-test#0000" : "Ar2ukVqx309sX+LoC9RVOpfATgXskt+Ser5jVr3Q2FOo@obyte.org/bb#0000";
const timeOutInSec = 10;

const assocRequestCallbacks = {};
var exchangeBotDeviceAddress;


function sellAt(price){
	sendOrder("sell", price);
}

function buyAt(price){
	sendOrder("buy", price);
}

function getOrders(bOnlyMine){
	const device = require('ocore/device.js');
	const tag = crypto.randomBytes(10).toString('base64');
	const command = bOnlyMine ? "orders" : "book";
	device.sendMessageToDevice(exchangeBotDeviceAddress,"object", {
		command: command,
		time_limit: Math.floor(new Date() / 1000) + timeOutInSec,
		tag: tag
	})

	assocRequestCallbacks[tag] = function(response){
		console.log(JSON.stringify(response));
		/* response example:
		* {"price":0.008607174,"order_type":"sell","total":0.4486},{"price":0.007832585,"order_type":"buy","total":11.274124698}
		*/
	};
	setTimeoutForCallback(tag);
}


function sendOrder(type, price){
	const device = require('ocore/device.js');
	const tag = crypto.randomBytes(10).toString('base64');
	device.sendMessageToDevice(exchangeBotDeviceAddress,"object", {
		command: type,
		price: price,
		time_limit: Math.floor(new Date() / 1000) + timeOutInSec,
		tag: tag
	})
	assocRequestCallbacks[tag] = function(response){
		if (response === "accepted"){
			const log_message = type +" order at " + price + " is accepted";
			console.log(log_message);
			logger.info(log_message);
		}
	};
	setTimeoutForCallback(tag);
}

function setTimeoutForCallback(tag){
	setTimeout(function(){
		delete assocRequestCallbacks[tag];
	}, 30000);
}

eventBus.on('object', function(from_address, receivedObject){
	if (from_address != exchangeBotDeviceAddress)
		return;

	//we execute callback from  request
	if (validationUtils.isNonemptyString(receivedObject.tag) && assocRequestCallbacks[receivedObject.tag]){
		assocRequestCallbacks[receivedObject.tag](receivedObject.response);
		return delete assocRequestCallbacks[receivedObject.tag];
	}

	//we treat a received payment notification
	if (receivedObject.event === "payment"){
		const log_message = "received payment of " + receivedObject.amount + " " + receivedObject.type + " - tx id: " + receivedObject.txid;
		console.log(log_message);
		logger.info(log_message);
	}

});

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
			getOrders(true);

		}
	});

});

exports.sellAt = sellAt;
exports.buyAt = buyAt;