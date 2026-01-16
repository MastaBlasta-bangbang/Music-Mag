class ShedProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.phase1 = 0;
        this.phase2 = 0;
        this.d1 = 0; this.d2 = 0; this.d3 = 0; this.d4 = 0;
        this.sampleRate = 44100;
        this.noiseState = 12345;
        
        // Chorus/Delay state
        this.chorusBufferL = new Float32Array(4410); 
        this.chorusBufferR = new Float32Array(4410);
        this.chorusWritePtr = 0;
        this.lfoPhase = 0;
        
        // Drift state
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
        const numFrames = output[0].length;

        const freqs = parameters.frequency;
        const cutoffs = parameters.cutoff;
        const resonances = parameters.resonance;
        const waveforms = parameters.waveform;
        const detunes = parameters.detune;
        const noiseMix = parameters.noise;
        const mode = parameters.mode; 

        for (let i = 0; i < numFrames; ++i) {
            const m = mode.length > 1 ? mode[i] : mode[0];
            const baseFreq = freqs.length > 1 ? freqs[i] : freqs[0];
            const cutoff = cutoffs.length > 1 ? cutoffs[i] : cutoffs[0];
            const resonance = resonances.length > 1 ? resonances[i] : resonances[0];
            const waveType = waveforms.length > 1 ? waveforms[i] : waveforms[0];
            
            // --- ANALOG DRIFT ---
            this.driftPhase = (this.driftPhase + 0.2 / this.sampleRate) % 1.0;
            const drift = Math.sin(this.driftPhase * 2 * Math.PI) * 0.5; // Tiny pitch drift
            const freq = baseFreq * Math.pow(2, drift / 1200);

            let val = 0;
            const dt1 = freq / this.sampleRate;

            if (m < 0.5) { // SYNTH MODE
                const detuneAmt = detunes.length > 1 ? detunes[i] : detunes[0];
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
                val = (osc1 * 0.5 + osc2 * 0.4) + (this.getNoise() * (noiseMix.length > 1 ? noiseMix[i] : noiseMix[0]));
                
                this.phase1 = (this.phase1 + dt1) % 1.0;
                this.phase2 = (this.phase2 + dt2) % 1.0;
            } 
            else if (m < 1.5) { // KICK MODE
                val = Math.sin(this.phase1 * 2 * Math.PI);
                this.phase1 = (this.phase1 + dt1) % 1.0;
            } 
            else if (m < 2.5) { // SNARE MODE
                val = (Math.sin(this.phase1 * 2 * Math.PI) * 0.2) + (this.getNoise() * 0.8);
                this.phase1 = (this.phase1 + dt1) % 1.0;
            } 
            else { // HI-HAT MODE
                val = this.getNoise();
            }

            // --- LADDER FILTER (Moog Style with Saturation) ---
            const g = Math.tan(cutoff * Math.PI / this.sampleRate);
            const k = resonance * 4.0;
            
            // Nonlinear feedback
            const sat = (x) => Math.tanh(x);
            const d1_in = (val - sat(this.d4 * k)) / (1.0 + g);
            
            this.d1 = this.d1 + g * (sat(d1_in) - sat(this.d1));
            this.d2 = this.d2 + g * (sat(this.d1) - sat(this.d2));
            this.d3 = this.d3 + g * (sat(this.d2) - sat(this.d3));
            this.d4 = this.d4 + g * (sat(this.d3) - sat(this.d4));

            let out = this.d4;

            // --- SOFT CLIPPING ---
            out = Math.tanh(out * 1.5);

            // --- STEREO WIDENING (Classic Chorus) ---
            this.lfoPhase = (this.lfoPhase + 0.6 / this.sampleRate) % 1.0;
            const lfo = Math.sin(this.lfoPhase * 2 * Math.PI);
            
            this.chorusBufferL[this.chorusWritePtr] = out;
            this.chorusBufferR[this.chorusWritePtr] = out;
            
            const delaySamples = 441 + lfo * 110; 
            const readPtr = (this.chorusWritePtr - Math.floor(delaySamples) + 4410) % 4410;
            
            const wetL = this.chorusBufferL[readPtr];
            const wetR = this.chorusBufferR[(readPtr + 80) % 4410]; 

            output[0][i] = out + wetL * 0.3;
            output[1][i] = out + wetR * 0.3;

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
            { name: "mode", defaultValue: 0 } 
        ];
    }
}

registerProcessor("shed-processor", ShedProcessor);
