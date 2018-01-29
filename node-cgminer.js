var net = require('net');

var cgSendCmd = function (command, config, node, callback) {
	var dataStg = '';
	var socket;
	try {
		socket = net.connect({ host: config.ip, port: config.port }, function () {
			socket.on('data', function (res) { dataStg += res.toString(); });				// build data string as it is recieved
			socket.on('end', function () {													// all data recieved from the response. Now pass to callback()
				socket.removeAllListeners();
				try { dataStg = JSON.parse(dataStg); }										// attempt to parse as an object, but if it fails, just return the string (my miners, for example, don't return proper json
				catch(err) { node.warn('Error parsing json: ' + err); }
				callback(dataStg);
				// return(dataStg);
			});
			socket.write(command);															// CGMiner can take commands as a simple string (for simple commands) or as json, i.e.: { command: command, parameter: parameter }
		});
		socket.on('error', function (err) {
			socket.removeAllListeners();
			node.error('Net socket error: ' + err);
			return null;
		});
	} catch (err) {
		node.error('Error in net socket connection: ' + err);
		return null;
	}
}

module.exports = function(RED) {
	RED.nodes.registerType("cgminer", function(config) {
		RED.nodes.createNode(this, config);
		var node = this;
		node.on('input', function(msg) {													// input can be a simple string representing a command to send to cg miner, or an object (or json) for commands with
			if (typeof msg !== 'string') msg = JSON.stringify(msg);							// paremeters, like this: { command: command, parameter: parameter }
			cgSendCmd(msg, config, node, function(cgMinerData) {
				msg.payload = cgMinerData;
				msg.title = 'CGMiner Data';													// see https://github.com/node-red/node-red/wiki/Node-msg-Conventions
				msg.description = 'JSON data from CGMiner';
				node.send(msg);																// msg.payload should contain object containing the miner data (or a string, if parsing the object failed)
			});
		});
	});
};
