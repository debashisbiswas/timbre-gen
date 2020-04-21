var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();

const INST_TYPE =
{
    SINE: 0,
    SQUARE: 1,
    TRIANGLE: 2,
    SAWTOOTH: 3,
    CLARINET: 4,
    BASS_CLARINET: 5,
    FLUTE: 6,
    OBOE: 7,
    BASSOON: 8,
    ALTOSAX: 9
}

function getAmplitudeFromDB(aDB)
{
    return Math.pow(10, aDB / 20);
}

const PARTIAL_PRESETS =
{
    SINE: [0.5],
    SQUARE: [0.1],
    TRIANGLE: [0.7],
    SAWTOOTH: [0.15],
    CLARINET: [
        getAmplitudeFromDB(0),
        getAmplitudeFromDB(-36),
        getAmplitudeFromDB(-3.2),
        getAmplitudeFromDB(-33),
        getAmplitudeFromDB(-5),
        getAmplitudeFromDB(-28),
        getAmplitudeFromDB(-17),
        getAmplitudeFromDB(-18.5),
        getAmplitudeFromDB(-26.6),
        getAmplitudeFromDB(-32.4),
        getAmplitudeFromDB(-26.2),
        getAmplitudeFromDB(-28),
    ],
    BASS_CLARINET: [ // these are currently the same as clarinet
        getAmplitudeFromDB(0),
        getAmplitudeFromDB(-36),
        getAmplitudeFromDB(-3.2),
        getAmplitudeFromDB(-33),
        getAmplitudeFromDB(-5),
        getAmplitudeFromDB(-28),
        getAmplitudeFromDB(-17),
        getAmplitudeFromDB(-18.5),
        getAmplitudeFromDB(-26.6),
        getAmplitudeFromDB(-32.4),
        getAmplitudeFromDB(-26.2),
        getAmplitudeFromDB(-28),
    ],
    FLUTE: [
        getAmplitudeFromDB(-8.2),
        getAmplitudeFromDB(-3.5),
        getAmplitudeFromDB(0),
        getAmplitudeFromDB(-10.8),
        getAmplitudeFromDB(-35.5),
        getAmplitudeFromDB(-14.8),
        getAmplitudeFromDB(-28.5),
        getAmplitudeFromDB(-50),
        getAmplitudeFromDB(-44.5),
        getAmplitudeFromDB(-36.5),
        getAmplitudeFromDB(-39),
        getAmplitudeFromDB(-45),
    ],
    OBOE: [
        getAmplitudeFromDB(-15.3),
        getAmplitudeFromDB(-10),
        getAmplitudeFromDB(0),
        getAmplitudeFromDB(-10.4),
        getAmplitudeFromDB(-30.6),
        getAmplitudeFromDB(-23),
        getAmplitudeFromDB(-22.5),
        getAmplitudeFromDB(-23),
        getAmplitudeFromDB(-24),
        getAmplitudeFromDB(-20.6),
        getAmplitudeFromDB(-32),
        getAmplitudeFromDB(-34),
    ],
    BASSOON: [
        getAmplitudeFromDB(-18),
        getAmplitudeFromDB(0),
        getAmplitudeFromDB(-25),
        getAmplitudeFromDB(-20),
        getAmplitudeFromDB(-26.8),
        getAmplitudeFromDB(-17.5),
        getAmplitudeFromDB(-26),
        getAmplitudeFromDB(-44.2),
        getAmplitudeFromDB(-32),
        getAmplitudeFromDB(-48.8),
        getAmplitudeFromDB(-44.5),
        getAmplitudeFromDB(-43.7),
    ],
    ALTOSAX: [
        getAmplitudeFromDB(-2.3),
        getAmplitudeFromDB(-3),
        getAmplitudeFromDB(-20.8),
        getAmplitudeFromDB(-14.5),
        getAmplitudeFromDB(-15.8),
        getAmplitudeFromDB(-22.2),
        getAmplitudeFromDB(-26.8),
        getAmplitudeFromDB(-22.4),
        getAmplitudeFromDB(-26.6),
        getAmplitudeFromDB(-23.8),
        getAmplitudeFromDB(-27),
        getAmplitudeFromDB(-26.4),
    ]
}
class Instrument
{
    /**
     * Given an array of overtone amplitudes, construct an additive
     * synth for that overtone structure
     */
    constructor(aInstType)
    {
        // waveType specifies the type used by the oscillator (sine, square, triangle, sawtooth)
        // partialAmplitudes is an array where each elem is the gain of the overtone at that index
        // octavePrefOffset is the preferred octave that the demos should be played, relative to 4 (treating 4 as middle)
        let waveType = 'sine';
        let partialAmplitudes = PARTIAL_PRESETS.SINE;
        let octavePrefOffset = 0;
        switch(aInstType)
        {
            case INST_TYPE.SQUARE:
                waveType = 'square';
                partialAmplitudes = PARTIAL_PRESETS.SQUARE;
                break;
            case INST_TYPE.TRIANGLE:
                waveType = 'triangle';
                partialAmplitudes = PARTIAL_PRESETS.TRIANGLE;
                break;
            case INST_TYPE.SAWTOOTH:
                waveType = 'sawtooth';
                partialAmplitudes = PARTIAL_PRESETS.SAWTOOTH;
                break;
            case INST_TYPE.CLARINET:
                partialAmplitudes = PARTIAL_PRESETS.CLARINET;
                octavePrefOffset = -1;
                break;
            case INST_TYPE.BASS_CLARINET:
                partialAmplitudes = PARTIAL_PRESETS.BASS_CLARINET;
                octavePrefOffset = -2;
                break;
            case INST_TYPE.FLUTE:
                partialAmplitudes = PARTIAL_PRESETS.FLUTE;
                break;
            case INST_TYPE.OBOE:
                partialAmplitudes = PARTIAL_PRESETS.OBOE;
                break;
            case INST_TYPE.BASSOON:
                partialAmplitudes = PARTIAL_PRESETS.BASSOON;
                octavePrefOffset = -1;
                break;
            case INST_TYPE.ALTOSAX:
                partialAmplitudes = PARTIAL_PRESETS.ALTOSAX;
                octavePrefOffset = -1;
                break;
            // sine is the default type
            default:
            case INST_TYPE.SINE:
                waveType = 'sine';
                partialAmplitudes = PARTIAL_PRESETS.SINE;
                octavePrefOffset = 0;
                break;
        }

        this.octaveOffset = octavePrefOffset;
        this.partials = partialAmplitudes.map(() => audioCtx.createOscillator());
        this.partialGains = partialAmplitudes.map(() => audioCtx.createGain());
        this.masterGain = audioCtx.createGain();

        partialAmplitudes.forEach((amp, index) => {
            this.partialGains[index].gain.value = amp;
            this.partials[index].connect(this.partialGains[index]);
            this.partials[index].type = waveType;
            this.partialGains[index].connect(this.masterGain);
        });
        this.masterGain.gain.value = 1 / partialAmplitudes.length;

        this.analyser = audioCtx.createAnalyser();
        this.masterGain.connect(this.analyser);
    }

    connect(dest) {
        this.analyser.connect(dest);
    }

    disconnect() {
        this.analyser.disconnect();
    }

    start(time = 0) {
        this.partials.forEach(o => o.start(time));
    }

    stop(time = 0) {
        this.partials.forEach(o => o.stop(time));
    }

    setFrequencyAtTime(frequency, time) {
        this.partials.forEach((o, index) => {
            o.frequency.setValueAtTime(frequency * (index + 1), time);
        });
    }

    exponentialRampToFrequencyAtTime(frequency, time) {
        this.partials.forEach((o, index) => {
            o.frequency.exponentialRampToValueAtTime(frequency * (index + 1), time);
        });
    }
}

let theInstrument = new Instrument();

const A4 = 440;

const Ab4 = A4 * Math.pow(2, -1 / 12);
const G4 = A4 * Math.pow(2, -2 / 12);
const Gb4 = A4 * Math.pow(2, -3 / 12);
const F4 = A4 * Math.pow(2, -4 / 12);
const E4 = A4 * Math.pow(2, -5 / 12);
const Eb4 = A4 * Math.pow(2, -6 / 12);
const D4 = A4 * Math.pow(2, -7 / 12);
const Db4 = A4 * Math.pow(2, -8 / 12);
const C4 = A4 * Math.pow(2, -9 / 12);
const B3 = A4 * Math.pow(2, -10 / 12);
const Bb3 = A4 * Math.pow(2, -11 / 12);
const A3 = A4 * Math.pow(2, -12 / 12);

function getUserSelectedInst()
{
    let selectedInst = INST_TYPE.SINE;
    switch($('#selectInst')[0].value.toLowerCase())
    {
        case 'sine':
            selectedInst = INST_TYPE.SINE;
            break;
        case 'square':
            selectedInst = INST_TYPE.SQUARE;
            break;
        case 'triangle':
            selectedInst = INST_TYPE.TRIANGLE;
            break;
        case 'sawtooth':
            selectedInst = INST_TYPE.SAWTOOTH;
            break;
        case 'flute':
            selectedInst = INST_TYPE.FLUTE;
            break;
        case 'oboe':
            selectedInst = INST_TYPE.OBOE;
            break;
        case 'clarinet':
            selectedInst = INST_TYPE.CLARINET;
            break;
        case 'bassclarinet':
            selectedInst = INST_TYPE.BASS_CLARINET;
            break;
        case 'bassoon':
            selectedInst = INST_TYPE.BASSOON;
            break;
        case 'altosax':
            selectedInst = INST_TYPE.ALTOSAX;
            break;
        default:
            selectedInst = INST_TYPE.SINE;
            break;
    }

    return selectedInst;
}

function clickLick()
{
    theInstrument = new Instrument(getUserSelectedInst());
    // let instrument = new Instrument(getUserSelectedInst());

    playLick(theInstrument);
}

function clickScale()
{
    theInstrument = new Instrument(getUserSelectedInst());
    // let instrument = new Instrument(getUserSelectedInst());

    playScale(theInstrument);
}

function clickDrone()
{
    theInstrument = new Instrument(getUserSelectedInst());
    // let instrument = new Instrument(getUserSelectedInst());

    playDrone(theInstrument);
}

function playDrone(aInst)
{
    let t = audioCtx.currentTime;
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset) * A4, t)

    aInst.connect(audioCtx.destination);
    aInst.start();
    aInst.stop(t + 3);
}

function playScale(aInst)
{
    let t = audioCtx.currentTime;
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * A3, t);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * B3, t + 0.5);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * Db4, t + 0.75);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * D4, t + 1);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * E4, t + 1.25);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * Gb4, t + 1.5);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * Ab4, t + 1.75);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * A4, t + 2);

    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * Ab4, t + 2.5);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * Gb4, t + 2.75);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * E4, t + 3);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * D4, t + 3.25);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * Db4, t + 3.5);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * B3, t + 3.75);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * A3, t + 4);

    aInst.connect(audioCtx.destination);
    aInst.start();
    aInst.stop(audioCtx.currentTime + 4.5);
}

function playLick(aInst)
{
    let t = audioCtx.currentTime;
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * D4, t);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * E4, t + 0.35);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * F4, t + 0.5);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * G4, t + 0.85);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * D4, t + 1);
    aInst.exponentialRampToFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * E4, t + 1.35);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * E4, t + 1.35);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * C4, t + 1.5);
    aInst.setFrequencyAtTime(Math.pow(2, aInst.octaveOffset + 1) * D4, t + 1.85);

    aInst.connect(audioCtx.destination);
    aInst.start();
    aInst.stop(audioCtx.currentTime + 2.25);
}

// Get a canvas defined with ID "oscilloscope"
var canvas = document.getElementById("oscilloscope");
var canvasCtx = canvas.getContext("2d");

// draw an oscilloscope of the current audio source

function draw() {
    requestAnimationFrame(draw);

    theInstrument.analyser.fftSize = 2048;
    var bufferLength = theInstrument.analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    theInstrument.analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = "#f8f9fa";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "#007bff";

    canvasCtx.beginPath();

    var sliceWidth = canvas.width * 1.0 / bufferLength;
    var x = 0;

    for (var i = 0; i < bufferLength; i++) {

        var v = dataArray[i] / 128.0;
        var y = v * canvas.height / 2;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}

draw();
