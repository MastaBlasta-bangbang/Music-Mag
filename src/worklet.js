class ShedProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.phase1 = 0;
        this.phase2 = 0;
        this.d1 = 0; this.d2 = 0; this.d3 = 0; this.d4 = 0;
        this.sampleRate = 44100;
        this.noiseState = 12345;
        
        // Chorus state
        this.chorusBufferL = new Float32Array(4410); 
        this.chorusBufferR = new Float32Array(4410);
        this.chorusWritePtr = 0;
        this.lfoPhase = 0;
        
        this.driftPhase = Math.random();

        this.port.onmessage = (e) => {
            if (e.data.type === "init") this.sampleRate = e.data.sampleRate;
        };
    }

    polyBlep(t, dt) {
        if (t < dt) {
            t /= dt;
            return t + t - t * t - 1.0;
        } else if (t > 1.0 - dt) {
            t = (t - 1.0) / dt;
            return t * t + t + t + 1.0;
        }
        return 0.0;
    }

    getNoise() {
        this.noiseState = (this.noiseState * 1664525 + 1013904223) | 0;
        return (this.noiseState / 0x7FFFFFFF);
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        if (!output || !output[0]) return true;
        const numFrames = output[0].length;

        // Helper to get parameter value safely
        const getParam = (name, index, defaultValue) => {
            const arr = parameters[name];
            if (!arr || arr.length === 0) return defaultValue;
            return arr.length > 1 ? arr[index] : arr[0];
        };

        for (let i = 0; i < numFrames; ++i) {
            const m = getParam("mode", i, 0);
            const baseFreq = getParam("frequency", i, 440);
            const cutoff = getParam("cutoff", i, 1000);
            const resonance = getParam("resonance", i, 0.5);
            const waveType = getParam("waveform", i, 1);
            const satAmt = getParam("saturation", i, 0.5);
            const cMix = getParam("chorusMix", i, 0.3);
            
            this.driftPhase = (this.driftPhase + 0.2 / this.sampleRate) % 1.0;
            const drift = Math.sin(this.driftPhase * 2 * Math.PI) * 0.5;
            const freq = baseFreq * Math.pow(2, drift / 1200);

            let val = 0;
            const dt1 = freq / this.sampleRate;

            if (m < 0.5) { // SYNTH MODE
                const detuneAmt = getParam("detune", i, 10);
                const dt2 = (freq * Math.pow(2, detuneAmt / 1200)) / this.sampleRate;
                
                const generateWave = (phase, dt, type) => {
                    if (type < 0.5) return Math.sin(phase * 2 * Math.PI);
                    if (type < 1.5) {
                        let v = 2.0 * phase - 1.0;
                        return v - this.polyBlep(phase, dt);
                    }
                    if (type < 2.5) {
                        let v = phase < 0.5 ? 1.0 : -1.0;
                        v += this.polyBlep(phase, dt);
                        v -= this.polyBlep((phase + 0.5) % 1.0, dt);
                        return v;
                    }
                    return 2.0 * (1.0 - 2.0 * Math.abs(phase - 0.5)) - 1.0;
                };
                
                let osc1 = generateWave(this.phase1, dt1, waveType);
                let osc2 = generateWave(this.phase2, dt2, waveType);
                const nMix = getParam("noise", i, 0);
                val = (osc1 * 0.5 + osc2 * 0.4) + (this.getNoise() * nMix);
                
                this.phase1 = (this.phase1 + dt1) % 1.0;
                this.phase2 = (this.phase2 + dt2) % 1.0;
            } 
            else if (m < 1.5) { // KICK
                val = Math.sin(this.phase1 * 2 * Math.PI);
                this.phase1 = (this.phase1 + dt1) % 1.0;
            } 
            else if (m < 2.5) { // SNARE
                val = (Math.sin(this.phase1 * 2 * Math.PI) * 0.2) + (this.getNoise() * 0.8);
                this.phase1 = (this.phase1 + dt1) % 1.0;
            } 
            else { // HI-HAT
                val = this.getNoise();
            }

            // --- LADDER FILTER ---
            const g = Math.tan(cutoff * Math.PI / this.sampleRate);
            const k = resonance * 4.0;
            const sat = (x) => Math.tanh(x);
            const d1_in = (val - sat(this.d4 * k)) / (1.0 + g);
            this.d1 = this.d1 + g * (sat(d1_in) - sat(this.d1));
            this.d2 = this.d2 + g * (sat(this.d1) - sat(this.d2));
            this.d3 = this.d3 + g * (sat(this.d2) - sat(this.d3));
            this.d4 = this.d4 + g * (sat(this.d3) - sat(this.d4));

            let out = this.d4;

            // --- DYNAMIC SATURATION ---
            out = Math.tanh(out * (1.0 + satAmt));

            // --- CHORUS ---
            this.lfoPhase = (this.lfoPhase + 0.6 / this.sampleRate) % 1.0;
            const lfo = Math.sin(this.lfoPhase * 2 * Math.PI);
            this.chorusBufferL[this.chorusWritePtr] = out;
            this.chorusBufferR[this.chorusWritePtr] = out;
            const delaySamples = 441 + lfo * 110; 
            const readPtr = (this.chorusWritePtr - Math.floor(delaySamples) + 4410) % 4410;
            const wetL = this.chorusBufferL[readPtr];
            const wetR = this.chorusBufferR[(readPtr + 80) % 4410]; 

            output[0][i] = out + wetL * cMix;
            if (output[1]) output[1][i] = out + wetR * cMix;

            this.chorusWritePtr = (this.chorusWritePtr + 1) % 4410;
        }
        return true;
    }

    static get parameterDescriptors() {
        return [
            { name: "frequency", defaultValue: 440 },
            { name: "cutoff", defaultValue: 1000 },
            { name: "resonance", defaultValue: 0.5 },
            { name: "waveform", defaultValue: 1 },
            { name: "detune", defaultValue: 10 },
            { name: "noise", defaultValue: 0 },
            { name: "mode", defaultValue: 0 },
            { name: "saturation", defaultValue: 0.5 },
            { name: "chorusMix", defaultValue: 0.3 }
        ];
    }
}

registerProcessor("shed-processor", ShedProcessor);
