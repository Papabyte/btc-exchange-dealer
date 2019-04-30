const bittrexAPI = require("./modules/bittrex_api");
const logger = require("./modules/logger");
const tradingConf = require("./trading_conf");
const exchangeBotAPI = require("./modules/exchange_bot_api.js");
const eventBus = require('ocore/event_bus.js');


checkConfig();

eventBus.on('headless_wallet_ready', function() {
	getLastPricesAndUpdate();
	setInterval(getLastPricesAndUpdate, tradingConf.refreshTimeInSec * 1000);
});

function getLastPricesAndUpdate() {
	console.log("\n" + new Date().toUTCString());
		setBuyPrice();
		setSellPrice();
}


function setBuyPrice() {

	bittrexAPI.getAvgBuyPriceForQuantity("BTC-GBYTE", tradingConf.averagedSize, function(err, price_btc_gb) {
		logger.info("BTC-GBYTE getAvgBuyPriceForQuantity " + price_btc_gb);

		if(err)
			return console.log(err);

		let myBuyingPriceInBTC = price_btc_gb * (1 - tradingConf.GB_to_BTC_margin / 100);

		if(myBuyingPriceInBTC > tradingConf.maxGBBuyingPriceInBTC) {
			logger.info(myBuyingPriceInBTC +" BTC max buying price exceeded");
			console.log("max buying price exceeded");
		} else {
			console.log("will place buy order at " + myBuyingPriceInBTC + " BTC");
			logger.info("will place buy order at " + myBuyingPriceInBTC + " BTC");
			exchangeBotAPI.buyAt(myBuyingPriceInBTC, function(err) {
				if(err)
					console.log(err)
			});
		}
	});

}

function setSellPrice() {

	bittrexAPI.getAvgSellPriceForQuantity("BTC-GBYTE", tradingConf.averagedSize, function(err, price_btc_gb) {
		logger.info("BTC-GBYTE getAvgSellPriceForQuantity " + price_btc_gb);
		if(err)
			return console.log(err);

		let mySellingPriceInBTC = price_btc_gb * (1 + tradingConf.BTC_to_GB_margin / 100);
		if(mySellingPriceInBTC < tradingConf.minGBSellingPriceInBTC) {
			logger.info(mySellingPriceInBTC +" BTC under min selling price");
			console.log("under minGBSellingPriceInBTC");
		} else {
			console.log("will place sell order at " + mySellingPriceInBTC + " BTC");
			logger.info("will place sell order at " + mySellingPriceInBTC + " BTC");

			exchangeBotAPI.sellAt(mySellingPriceInBTC, function(err) {
				if(err)
					console.log(err)
			});
		}
	});
}

function checkConfig(){
	checkIfPositiveNumber(tradingConf,"refreshTimeInSec");

	checkIfNonNegativeNumber(tradingConf, "GB_to_BTC_margin");
	checkIfNonNegativeNumber(tradingConf, "BTC_to_GB_margin");
	checkIfNonNegativeNumber(tradingConf, "GB_to_USDT_margin");
	checkIfNonNegativeNumber(tradingConf, "USDT_to_GB_margin");

	checkIfNonNegativeNumber(tradingConf, "minGBSellingPriceInBTC");
	checkIfNonNegativeNumber(tradingConf, "maxGBBuyingPriceInBTC");

}

function checkIfNonNegativeNumber (object, key){
	if (!object || !object[key] || typeof object[key] != "number" || object[key] < 0)
		throw Error("Wrong config, " + key + " must be a number >= 0");
}

function checkIfPositiveNumber (object, key){
	if (!object || !object[key] || typeof object[key] != "number" || object[key] <= 0)
		throw Error("Wrong config, " + key + " must be a number > 0");
}

function checkIfNonEmptyString(object, key){
	if (!object || !object[key] || typeof object[key] != "string" || object[key].length === 0)
	throw Error("Wrong config, " + key + " must be a non empty string");
}

