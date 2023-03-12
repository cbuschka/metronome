// Registering Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

var audioContext = null;
var isPlaying = false;      // Are we currently playing?
var startTime;              // The start time of the entire sequence.
var currentTwelveletNote;        // What note is currently last scheduled?
var tempo = 120.0;          // tempo (in beats per minute)
var meter = 4;
var masterVolume = 0.25;
var accentVolume = 1;
var quarterVolume = 0.75;
var eighthVolume = 0;
var sixteenthVolume = 0;
var tripletVolume = 0;
var lookahead = 25.0;       // How frequently to call scheduling function
                            //(in milliseconds)
var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
                            // This is calculated from lookahead, and overlaps
                            // with next interval (in case the timer is late)
var nextNoteTime = 0.0;     // when the next note is due.
var noteLength = 0.05;      // length of "beep" (in seconds)
var notesInQueue = [];      // the notes that have been put into the web audio,
                            // and may or may not have played yet. {note, time}
var timerWorker = null;     // The Web Worker used to fire timer messages

function maxBeats() {
  var beats = (meter * 12);
  return beats;
}

function nextTwelvelet() {
  var secondsPerBeat = 60.0 / tempo;
  nextNoteTime += 0.08333 * secondsPerBeat;    // Add beat length to last beat time
  currentTwelveletNote++;    // Advance the beat number, wrap to zero

  if (currentTwelveletNote == maxBeats()) {
    currentTwelveletNote = 0;
  }
}

function calcVolume(beatVolume) {
  return (beatVolume * masterVolume);
}

function scheduleNote(beatNumber, time) {
  // push the note on the queue, even if we're not playing.
  notesInQueue.push({ note: beatNumber, time: time });

  // create oscillator & gainNode & connect them to the context destination
  var osc = audioContext.createOscillator();
  var gainNode = audioContext.createGain();

  osc.connect(gainNode);
  gainNode.connect(audioContext.destination);

  if (beatNumber % maxBeats() === 0) {
    if (accentVolume > 0.25) {
      osc.frequency.value = 880.0;
      gainNode.gain.value = calcVolume(accentVolume);
    } else {
      osc.frequency.value = 440.0;
      gainNode.gain.value = calcVolume(quarterVolume);
    }
  } else if (beatNumber % 12 === 0) {   // quarter notes = medium pitch
    osc.frequency.value = 440.0;
    gainNode.gain.value = calcVolume(quarterVolume);
  } else if (beatNumber % 6 === 0) {
    osc.frequency.value = 440.0;
    gainNode.gain.value = calcVolume(eighthVolume);
  } else if (beatNumber % 4 === 0) {
    osc.frequency.value = 300.0;
    gainNode.gain.value = calcVolume(tripletVolume);
  } else if (beatNumber % 3 === 0 ) {                    // other 16th notes = low pitch
    osc.frequency.value = 220.0;
    gainNode.gain.value = calcVolume(sixteenthVolume);
  } else {
    gainNode.gain.value = 0;   // keep the remaining twelvelet notes inaudible
  }

  osc.start(time);
  osc.stop(time + noteLength);
}

function scheduler() {
  while (nextNoteTime < audioContext.currentTime + scheduleAheadTime ) {
    scheduleNote( currentTwelveletNote, nextNoteTime );
    nextTwelvelet();
  }
}

function play() {
  isPlaying = !isPlaying;

  if (isPlaying) {
    currentTwelveletNote = 0;
    nextNoteTime = audioContext.currentTime;
    timerWorker.postMessage("start");
    document.getElementById("playButton").classList.add("paused");
  } else {
    document.getElementById("playButton").classList.remove("paused");
    timerWorker.postMessage("stop");
  }
}

function init(){
  audioContext = new AudioContext();
  timerWorker = new Worker("js/worker.js");

  timerWorker.onmessage = function(e) {
    if (e.data == "tick") {
      scheduler();
    } else {
      console.log("message: " + e.data);
    }
  };

  timerWorker.postMessage({"interval":lookahead});

  document.getElementById("playButton").addEventListener("click", play);
  document.getElementById("bpmInput").addEventListener("input", (ev) => {
    tempo = ev.target.value;
    bpmOutput.value = bpmInput.value;
  });
  document.getElementById("countInput").addEventListener("input", (ev) => {
    meter = ev.target.value;
    countOutput.value = countInput.value;
  });
  document.getElementById("masterVolumeInput").addEventListener("input", (ev) => {
    masterVolume = ev.target.value / 100;
  });
  document.getElementById("accentVolumeInput").addEventListener("input", (ev) => {
    accentVolume = ev.target.value / 100;
  });
  document.getElementById("quarterVolumeInput").addEventListener("input", (ev) => {
   quarterVolume = ev.target.value / 100; 
  });
  document.getElementById("eighthVolumeInput").addEventListener("input", (ev) => {
    eighthVolume = ev.target.value / 100;
  });
  document.getElementById("sixteenthVolumeInput").addEventListener("input", (ev) => {
   sixteenthVolume = ev.target.value / 100; 
  });
  document.getElementById("tripletVolumeInput").addEventListener("input", (ev) => {
    tripletVolume = ev.target.value / 100;
  });
}

window.addEventListener("load", init );
