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

        for (let channel = 0; channel < output.length; ++channel) {
            const outputChannel = output[channel];
            for (let i = 0; i < outputChannel.length; ++i) {
                const freq = freqs.length > 1 ? freqs[i] : freqs[0];
                const cutoff = cutoffs.length > 1 ? cutoffs[i] : cutoffs[0];
                const resonance = resonances.length > 1 ? resonances[i] : resonances[0];

                const dt = freq / this.sampleRate;
                
                // PolyBLEP Sawtooth
                let val = 2.0 * this.phase - 1.0;
                val -= this.polyBlep(this.phase, dt);

                // Ladder Filter
                const g = Math.tan(cutoff * Math.PI / this.sampleRate);
                const k = resonance * 4.0;
                const d1_in = (val - this.d4 * k) / (1.0 + g);
                this.d1 = this.d1 + g * (d1_in - this.d1);
                this.d2 = this.d2 + g * (this.d1 - this.d2);
                this.d3 = this.d3 + g * (this.d2 - this.d3);
                this.d4 = this.d4 + g * (this.d3 - this.d4);

                outputChannel[i] = this.d4;
                this.phase = (this.phase + dt) % 1.0;
            }
        }
        return true;
    }

    static get parameterDescriptors() {
        return [
            { name: "frequency", defaultValue: 440, minValue: 20, maxValue: 20000 },
            { name: "cutoff", defaultValue: 1000, minValue: 20, maxValue: 20000 },
            { name: "resonance", defaultValue: 0.5, minValue: 0, maxValue: 0.99 }
        ];
    }
}

registerProcessor("shed-processor", ShedProcessor);
