var timerID=null;
var interval=100;

self.onmessage=function(e){
	if (e.data=="start") {
		console.log("[worker] starting");
		timerID=setInterval(function(){postMessage("tick");},interval);
	}
	else if (e.data.interval) {
		console.log("[worker] setting interval");
		interval=e.data.interval;
		console.log("[worker] interval="+interval);
		if (timerID) {
			clearInterval(timerID);
			timerID=setInterval(function(){postMessage("tick");},interval);
		}
	}
	else if (e.data=="stop") {
		console.log("[Worker] stopping");
		clearInterval(timerID);
		timerID=null;
	}
};

postMessage('loaded');
