require('coffee-script');
var CGMinerClient = require('cgminer');

module.exports = function(RED) {
	RED.nodes.registerType("cgminer", function(config) {
		var client = new CGMinerClient();
		client.host = config.ip;
		client.port = config.port;

		var node = this;
		node.on('input', function(msg) {

			var objectifyMinerData = function(dataString) {		// take miner data string and convert it to an object
				var rtn = {};
				var arr = dataString.split('] ');
				for (var i = 0; i < arr.length; i++) {
					var key = arr[i].slice(0, arr[i].indexOf('['));
					var val = arr[i].slice(arr[i].indexOf('[') + 1);
					rtn[key] = val;
				}
				return rtn;
			};

			var parseMinerData = function(resultToParse) {		// return object containing the miner data obtained from cgminer
				// var minerDataArr = []
node.warn("27 - parseMinerData()");
				for (var i = 0; i < resultToParse.STATS.length; i++) {										// cgminer api returns a count of miners under a given AUC3 controller for my Avalon Miners. Not sure if this is universal.
					if (resultToParse.STATS[i].hasOwnProperty('MM Count')) {								// This contains data for each individual miner, and is really the main data I'm interested in for my setup...
						for (var j = 1; j <= resultToParse.STATS[i]['MM Count']; j++) {						// MM Count starts with 1, not 0
							// minerDataArr.push(objectifyMinerData(resultToParse.STATS[i]['MM ID' + j]));
							resultToParse.STATS[i]['MM ID' + j] = objectifyMinerData(resultToParse.STATS[i]['MM ID' + j]);		// replace MM ID data with object containing that data
						}
					}
				}
node.warn("35 - parseMinerData() return \n" + resultToParse);
				return resultToParse;
			};
			
			// obtain stats from cgminer and send the data as msg payload
			client.stats().then(function(cgMinerData) {
				msg.payload = parseMinerData(cgMinerData);		// parse data once promise is returned
				node.send(msg);									// msg.payload should contain object containing the miner data
			}).done();
		});
	});
};
