let audioCtx = new AudioContext();

const INST_TYPE =
{
    SINE: 'sine',
    CLARINET: 'clarinet',
    FLUTE: 'flute'
}

function buildPartial(aFreq, aNum, aGain)
{
    // calculate frequency of partial
    // aNum is the partial, where 1 is the fundamental, 2 is the first overtone, etc.
    let partialFrequency = aNum * aFreq;
    resultObject =
    {
        frequency: partialFrequency,
        gain: aGain
    };

    return resultObject;
}

class Instrument
{
    constructor(aType, aFreq = 440)
    {
        this.type = aType;
        this.frequency = aFreq;
        this.playing = false;
        switch(aType)
        {
            case INST_TYPE.FLUTE:
                this.partialTable =
                [
                    buildPartial(this.frequency, 1, 1),
                    buildPartial(this.frequency, 2, 0.1),
                    buildPartial(this.frequency, 3, 1),
                    buildPartial(this.frequency, 4, 0.3),
                    buildPartial(this.frequency, 5, 0.2),
                    buildPartial(this.frequency, 6, 0.15),
                    buildPartial(this.frequency, 7, 0.1)
                ];
                break;
            case INST_TYPE.CLARINET:
                this.partialTable = 
                [
                    buildPartial(this.frequency, 1, 1),
                    buildPartial(this.frequency, 3, 0.14),
                    buildPartial(this.frequency, 5, 0.11),
                    buildPartial(this.frequency, 7, 0.11),
                    buildPartial(this.frequency, 9, 0.1),
                    buildPartial(this.frequency, 11, 0.07),
                    buildPartial(this.frequency, 13, 0.06)
                ];
                break;
            case INST_TYPE.SINE:
            default:
                this.partialTable =
                [
                    buildPartial(this.frequency, 1, 1)
                ];
                break;
        }

        this.refreshPartials();
    }

    refreshPartials()
    {
        this.partials = this.partialTable.map(() => audioCtx.createOscillator());
        this.partialGains = this.partialTable.map(() => audioCtx.createGain());
        this.masterGain = audioCtx.createGain();

        this.partialTable.forEach((partialData, index) =>
        {
            this.partials[index].frequency.value = partialData.frequency;
            this.partialGains[index].gain.value = partialData.gain;
            this.partials[index].connect(this.partialGains[index]);
            this.partialGains[index].connect(this.masterGain);
        });
        this.masterGain.value = (1 / this.partialTable.length);
    }

    connect(dest)
    {
        this.masterGain.connect(dest);
        this.playing = true;
    }

    disconnect()
    {
        this.masterGain.disconnect();
        this.playing = false;
    }

    start(time = 0)
    {
        this.partials.forEach(o => o.start(time));
    }

    stop(time = 0)
    {
        this.partials.forEach(o => o.stop(time));
    }
}

// ---------- EVENT HANDLERS ----------

let inst = new Instrument(INST_TYPE.CLARINET, 220);
inst.start();
function handleButtonClick()
{
    if(!inst.playing)
    {
        inst.connect(audioCtx.destination);
    }
    else
    {
        inst.disconnect(audioCtx.destination);
    }
}