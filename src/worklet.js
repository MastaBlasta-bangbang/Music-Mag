class ShedProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.phase = 0;
        this.d1 = 0; this.d2 = 0; this.d3 = 0; this.d4 = 0;
        this.sampleRate = 44100;
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

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const freqs = parameters.frequency;
        const cutoffs = parameters.cutoff;
        const resonances = parameters.resonance;
        const waveforms = parameters.waveform;

        const numFrames = output[0].length;

        for (let i = 0; i < numFrames; ++i) {
            const freq = freqs.length > 1 ? freqs[i] : freqs[0];
            const cutoff = cutoffs.length > 1 ? cutoffs[i] : cutoffs[0];
            const resonance = resonances.length > 1 ? resonances[i] : resonances[0];
            const waveType = waveforms.length > 1 ? waveforms[i] : waveforms[0];

            const dt = freq / this.sampleRate;
            let val = 0;

            // Waveform selection logic
            // 0: Sine, 1: Saw, 2: Square, 3: Triangle
            if (waveType < 0.5) { // Sine
                val = Math.sin(this.phase * 2 * Math.PI);
            } else if (waveType < 1.5) { // Saw
                val = 2.0 * this.phase - 1.0;
                val -= this.polyBlep(this.phase, dt);
            } else if (waveType < 2.5) { // Square
                val = this.phase < 0.5 ? 1.0 : -1.0;
                val += this.polyBlep(this.phase, dt);
                val -= this.polyBlep((this.phase + 0.5) % 1.0, dt);
            } else { // Triangle
                val = 2.0 * (1.0 - 2.0 * Math.abs(this.phase - 0.5)) - 1.0;
            }

            // Ladder Filter (Moog Style)
            const g = Math.tan(cutoff * Math.PI / this.sampleRate);
            const k = resonance * 4.0;
            const d1_in = (val - this.d4 * k) / (1.0 + g);
            this.d1 = this.d1 + g * (d1_in - this.d1);
            this.d2 = this.d2 + g * (this.d1 - this.d2);
            this.d3 = this.d3 + g * (this.d2 - this.d3);
            this.d4 = this.d4 + g * (this.d3 - this.d4);

            // Write to all output channels
            for (let channel = 0; channel < output.length; ++channel) {
                output[channel][i] = this.d4;
            }

            this.phase = (this.phase + dt) % 1.0;
        }
        return true;
    }

    static get parameterDescriptors() {
        return [
            { name: "frequency", defaultValue: 440, minValue: 20, maxValue: 20000 },
            { name: "cutoff", defaultValue: 1000, minValue: 20, maxValue: 20000 },
            { name: "resonance", defaultValue: 0.5, minValue: 0, maxValue: 0.99 },
            { name: "waveform", defaultValue: 1, minValue: 0, maxValue: 3 } // 0: Sine, 1: Saw, 2: Square, 3: Triangle
        ];
    }
}

registerProcessor("shed-processor", ShedProcessor);