
var play = function(pjs) {

	//style
	var bkg = pjs.color(250);
	var wordColor = pjs.color(60,172);
	var fontSize = 60;

	//vars
	var words = [];
	var groups = [];
	var currWord = null;

	//physical constants
	var K = .01;
	var G = 1000;
	var maxAccel = 2;
	var maxFloatV = 4;
	var snapDist;
	var floatMultiplier = .37;
	var defaultFallSpeed = 1;

	pjs.setup = function(){
		pjs.size(pjs.screenWidth,pjs.screenHeight);
		pjs.noStroke();
		pjs.smooth();
		pjs.textAlign(pjs.CENTER);
		var ratio = pjs.height/pjs.width;
		snapDist = pjs.width*ratio/4;
	};

	pjs.draw = function(){
		pjs.background(bkg);

		for(var i = 0; i<groups.length; i++) {
			groups[i].tick();
		};
		
		pjs.removeGroup();
		
	};

	pjs.mousePressed = function(){
		if(words.length <= 0){
			return;
		}
		var mouse = new pjs.PVector(pjs.mouseX, pjs.mouseY);
		var minWord = words[0];
		var minDist = pjs.PVector.dist(mouse, words[0].pos);

		if(words.length > 1){
			for(var i=1; i<words.length; i++){
				var currDist = pjs.PVector.dist(mouse,words[i].pos);
				if(currDist < minDist){
					minDist = currDist;
					minWord = words[i];
				}
			}
		}
		if(minDist < snapDist)
			currWord = minWord;
	};

	pjs.mouseReleased = function(){
		if(currWord == null){
			return;
		}

		currWord.lastPos.sub(currWord.pos);
		currWord.v.x = currWord.lastPos.x/-5;
		currWord.v.y = currWord.lastPos.y/-5;

		if(words.length > 1){
			var minWord = null;
			var minDist = 1e9;

			//find nearest word
			for(var i=0; i<words.length; i++){
				if(words[i] != currWord){
					var currDist = pjs.PVector.dist(currWord.pos,words[i].pos);
					if(currDist < minDist){
						minDist = currDist;
						minWord = words[i];
					}
				}
			}

			if(minDist < snapDist){
				//reset group
				currWord.group.removeWord(currWord); //remove from current group
				if(currWord.group.words.length == 0){
					var index = groups.indexOf(currWord.group);
					groups.splice(index, 1);
				}
				currWord.group = null;

				if(!minWord.group){
					currWord.group = new pjs.WordGroup();
					currWord.group.addWord(minWord);
					currWord.group.addWord(currWord);
					groups.push(currWord.group);
				}else{ //minword has a group
					currWord.group = minWord.group;
					currWord.group.addWord(currWord);
				}
			}else{
				//snap out of group
				if(currWord.group.words.length > 1){
					currWord.group.removeWord(currWord); //remove from current group
					currWord.group = new pjs.WordGroup();
					currWord.group.addWord(currWord);
					groups.push(currWord.group);
				}
			}
		}
		
		currWord = null;
	};

	//on mouse drag, snap out of group if out of snap distance
	pjs.mouseDragged = function(){
		if(currWord == null){
			return;
		}

		if(words.length > 1){
			var minWord = null;
			var minDist = 1e9;

			//find nearest word
			for(var i=0; i<currWord.group.words.length; i++){
				var other = currWord.group.words[i];
				if(other != currWord){
					var currDist = pjs.PVector.dist(currWord.pos,other.pos);
					if(currDist < minDist){
						minDist = currDist;
						minWord = other;
					}
				}
			}

			if(minDist > snapDist){
				//snap out of group
				if(currWord.group.words.length > 1){
					currWord.group.removeWord(currWord); //remove from current group
					currWord.group = new pjs.WordGroup();
					currWord.group.addWord(currWord);
					groups.push(currWord.group);
				}
			}
		}
		
	};

	pjs.dropWords = function(wordArr){
		var group = new pjs.WordGroup();
		for(var i=wordArr.length-1; i>=0; i--){
			var word = new pjs.Word(wordArr[i]);
			console.log(word);
			words.push(word);
			group.addWord(word);
		}
		groups.push(group);
	};

	pjs.floatWords = function(wordArr){
		var group = new pjs.WordGroup();
		for(var i=wordArr.length-1; i>=0; i--){
			var word = new pjs.Word(wordArr[i]);
			word.pos.y = pjs.height + fontSize*1.5 + (i)*50;
			WORD = word;
			console.log(word);
			words.push(word);
			group.addWord(word);
		}
		groups.push(group);
		
	};

	pjs.removeGroup = function(){
		if(groups.length < 1){
			return;
		}

		var toRemove = [];

		var word = words[0];
		
		for(var i=0; i<groups.length; i++){
			var firstWord = groups[i].words[0];
			if(firstWord.pos.y > pjs.height + fontSize*1.2 && groups[i].words.length < 3){
				toRemove.push(i);
				var wordArr = [];
				for(var j=0; j<groups[i].words.length; j++){
					var curr = groups[i].words[j];
					wordArr.push(curr.text);
				}
				Comm.dropWords(wordArr);
			}
			var lastWord = groups[i].words[groups[i].words.length-1];
			if(lastWord.pos.y < -1.2*fontSize && groups[i].words.length >= 3){
				toRemove.push(i);
				var wordArr = [];
				for(var j=0; j<groups[i].words.length; j++){
					var curr = groups[i].words[j];
					wordArr.push(curr.text);
				}
				Comm.floatWords(wordArr);
			}
		}

		for(var i=0; i<toRemove.length; i++){
			var curr = groups[toRemove[i]];
			groups.splice(toRemove[i],1);
			for(var i=0; i<curr.words.length; i++){
				var w = curr.words[i];
				var index = words.indexOf(w);
				words.splice(index, 1);
			}
			console.log(words);
			console.log(groups);
		}

	};

	pjs.Word = function(text){

		this.text = text;
		this.pos = new pjs.PVector(pjs.random(pjs.width/8, pjs.width*7/8), -100);
		this.lastPos = new pjs.PVector();
		this.v = new pjs.PVector();
		this.a = new pjs.PVector();
		this.size = fontSize;
		this.rot = pjs.random(-1*Math.PI/25,Math.PI/25);
		this.color = wordColor;
		this.group = null;

		this.render = function(){
			this.lastPos.x = this.pos.x;
			this.lastPos.y = this.pos.y;
			if(this == currWord){
				this.pos.x = pjs.mouseX;
				this.pos.y = pjs.mouseY;
			}else{
				//drag
				this.v.mult(.9);
				
				this.pos.y += defaultFallSpeed;

				this.limitAccel();
				this.v.add(this.a);
				this.pos.add(this.v);
			}
			pjs.fill(this.color);
			if(this == currWord){
				pjs.textSize(this.size*1.1);
			}else{
				pjs.textSize(this.size);
			}
			pjs.pushMatrix();
			pjs.translate(this.pos.x, this.pos.y);
			pjs.rotate(this.rot + this.v.x/50);
			pjs.text(this.text, 0, 0); 
			pjs.popMatrix();

			this.a.x = 0;
			this.a.y = 0;
		};

		this.hooke = function(other){
			var fromOrig = pjs.PVector.sub(this.pos,other.pos);
			fromOrig.mult(-1*K)
			this.a.x += fromOrig.x;
			this.a.y += fromOrig.y/5;
		};

		this.coloumb = function(other){
			var dist = pjs.PVector.dist(other.pos, this.pos);
			var accel = new pjs.PVector(this.pos.x, this.pos.y);
			accel.sub(other.pos);
			accel.normalize();
			accel.mult(G/(dist*dist));
			this.a.add(accel);
		};

		this.limitAccel = function(){
			if(this.a.x > maxAccel){
					this.a.x = maxAccel;
			}
			else if(this.a.x < -1*maxAccel){
					this.a.x = -1*maxAccel;
			}

			if(this.a.y > maxAccel){
					this.a.y = maxAccel;
			}
			else if(this.a.y < -1*maxAccel){
					this.a.y = -1*maxAccel;
			}
		};

	};

	pjs.WordGroup = function(){
		this.words = [];

		this.addWord = function(word){
			if(this.words.indexOf(word) == -1){
				//console.log("added: " + word.text);
				this.words.push(word);
				word.group = this;
			}
			this.sort();
		};

		this.removeWord = function(word){
			var index = this.words.indexOf(word);
			if(index >= 0){
				this.words.splice(index, 1);
			}
		}

		this.sort = function(){
			this.words.sort(function(a,b){
				return a.pos.y - b.pos.y;
			});
			//console.log(this.words);
		}

		this.tick = function(){
			var floatV = this.words.length*floatMultiplier;
			if(floatV > maxFloatV){
				floatV = maxFloatV;
			}
			for(var i=0; i<this.words.length; i++){
				var curr = this.words[i];
				curr.pos.y -= floatV;
				if(this.words[i-1]){
					curr.hooke(this.words[i-1]);
					curr.coloumb(this.words[i-1]);
				}
				if(this.words[i+1]){
					curr.hooke(this.words[i+1]);
					curr.coloumb(this.words[i+1]);
				}
				curr.render();
			}
		};
	};

};

var canvas = document.getElementById("pcanvas");
var pjs = new Processing(canvas, play);
