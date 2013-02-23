
var fs = require('fs');

var io;
var dict = [];

var recentPhrases = [];
var maxSize = 100;

var loadFile = function(){
	var file = fs.readFileSync("server/dict.txt","utf8");
	var lines = file.split('\r\n');
	for(var i=0; i<lines.length; i++){
		var curr = lines[i].toLowerCase();
		if(curr.length > 4 && curr.length < 9){
			dict.push(curr);
		}
	}
}

var updatePhrases = function(wordArr){
	var phrase = '';
	for(var i=0; i<wordArr.length; i++){
		if(i>0){
			phrase += ' ';
		}
		phrase += wordArr[i];
	}
	recentPhrases.splice(0,0,phrase);
	if(recentPhrases.length > maxSize){
		recentPhrases.splice(recentPhrases.length-1,1);
	}
};

var getPhrases = function(){
	return recentPhrases;
}

var broadcastWord = function(){
	var rand = Math.floor(Math.random()*dict.length);
	var word = dict[rand];
	//console.log(word);
	var clients = io.sockets.clients();
	if(clients.length > 0)
		clients[0].emit('dropwords', {words: [word]});
}


var connect = function(socket){

	socket.on('dropwords', function (msg) {
		var words = msg.words;
		console.log('drop_words: ' + words);
		var clients = io.sockets.clients();
		for(var i=0; i<clients.length; i++){
			var id = clients[i].id;
			if(id === socket.id && clients.length > i+1){
				io.sockets.sockets[clients[i+1].id].emit('dropwords', msg);
				return;
			}
		}
	});

	socket.on('floatwords', function (msg) {
		var words = msg.words;
		console.log('add_words: ' + words);
		var clients = io.sockets.clients();

		if(socket.id === clients[0].id){
			console.log(msg.words);
			updatePhrases(msg.words);
		}

		for(var i=0; i<clients.length; i++){
			var id = clients[i].id;
			if(id === socket.id){
				if(i > 0){
					io.sockets.sockets[clients[i-1].id].emit('floatwords', msg);
				}
				return;
			}
		}
	});
};


exports.init = function(cio){
	io = cio;
	io.sockets.on('connection', connect);

	setInterval(broadcastWord, 3000);
}

exports.getPhrases = getPhrases;

loadFile();
