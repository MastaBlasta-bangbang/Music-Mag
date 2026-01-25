/**
 * SHED Audio Processor - Professional Quality Synthesis
 * Supports: Synth (mode 0), Kick (mode 1), Snare (mode 2), Hi-Hat (mode 3)
 */
class ShedProcessor extends AudioWorkletProcessor {
    constructor() {
        super();

        // Sample rate from AudioWorkletGlobalScope
        this.sr = sampleRate;

        // === SYNTH STATE ===
        this.phase1 = 0;
        this.phase2 = 0;
        this.phase3 = 0;

        // Ladder filter state (4-pole)
        this.synthFilter = { d1: 0, d2: 0, d3: 0, d4: 0 };

        // Filter envelope
        this.filterEnvValue = 1.0;
        this.filterEnvTarget = 0.3;
        this.filterEnvSpeed = 0.9995; // Decay speed

        // Analog drift
        this.driftPhase = Math.random();

        // Chorus
        const chorusSize = Math.ceil(this.sr * 0.05);
        this.chorusBufferL = new Float32Array(chorusSize);
        this.chorusBufferR = new Float32Array(chorusSize);
        this.chorusSize = chorusSize;
        this.chorusPtr = 0;
        this.lfoPhase = 0;

        // === KICK STATE ===
        this.kickPhase = 0;
        this.kickClickPhase = 0;

        // === SNARE STATE ===
        this.snareBodyPhase = 0;
        this.snareNoiseFilter = { lp1: 0, lp2: 0, hp1: 0, hp2: 0 };

        // === HI-HAT STATE ===
        this.hhPhases = new Float32Array(6);
        this.hhRatios = [1.0, 1.4983, 1.7424, 1.9858, 2.4631, 2.6306];
        this.hhFilter = { hp1: 0, hp2: 0, lp1: 0, lp2: 0 };

        // === NOISE STATE ===
        this.noiseState = Math.floor(Math.random() * 0x7FFFFFFF);

        // === DC BLOCKER ===
        this.dcX = 0;
        this.dcY = 0;

        // Message handling
        this.port.onmessage = (e) => {
            if (e.data.type === "noteOn") {
                // Reset filter envelope on new note
                this.filterEnvValue = 1.0;
            }
        };
    }

    // === UTILITY FUNCTIONS ===

    getNoise() {
        this.noiseState = (this.noiseState * 1664525 + 1013904223) >>> 0;
        return (this.noiseState / 0x7FFFFFFF) * 2 - 1;
    }

    // Pink noise approximation (warmer than white)
    pinkNoise() {
        const white = this.getNoise();
        // Simple pinking filter
        this.pinkB0 = 0.99886 * (this.pinkB0 || 0) + white * 0.0555179;
        this.pinkB1 = 0.99332 * (this.pinkB1 || 0) + white * 0.0750759;
        this.pinkB2 = 0.96900 * (this.pinkB2 || 0) + white * 0.1538520;
        this.pinkB3 = 0.86650 * (this.pinkB3 || 0) + white * 0.3104856;
        this.pinkB4 = 0.55000 * (this.pinkB4 || 0) + white * 0.5329522;
        this.pinkB5 = -0.7616 * (this.pinkB5 || 0) - white * 0.0168980;
        const pink = (this.pinkB0 + this.pinkB1 + this.pinkB2 + this.pinkB3 + this.pinkB4 + this.pinkB5 + white * 0.5362) * 0.11;
        return pink;
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

    softClip(x) {
        return Math.tanh(x);
    }

    dcBlock(x) {
        const R = 0.995;
        this.dcY = x - this.dcX + R * this.dcY;
        this.dcX = x;
        return this.dcY;
    }

    // One-pole lowpass
    lpf(input, state, freq) {
        const rc = 1.0 / (2.0 * Math.PI * freq);
        const dt = 1.0 / this.sr;
        const alpha = dt / (rc + dt);
        state.v = state.v + alpha * (input - state.v);
        return state.v;
    }

    // One-pole highpass
    hpf(input, state, freq) {
        const rc = 1.0 / (2.0 * Math.PI * freq);
        const dt = 1.0 / this.sr;
        const alpha = rc / (rc + dt);
        const out = alpha * (state.prevOut + input - state.prevIn);
        state.prevIn = input;
        state.prevOut = out;
        return out;
    }

    // === SYNTH SYNTHESIS ===

    processSynth(freq, cutoff, resonance, waveType, detune, noise, saturation, chorusMix) {
        // Analog drift
        this.driftPhase = (this.driftPhase + 0.12 / this.sr) % 1.0;
        const drift = Math.sin(this.driftPhase * Math.PI * 2) * 0.4;
        const driftedFreq = freq * Math.pow(2, drift / 1200);

        const dt1 = Math.min(driftedFreq / this.sr, 0.49);
        const dt2 = Math.min((driftedFreq * Math.pow(2, detune / 1200)) / this.sr, 0.49);
        const dt3 = Math.min((driftedFreq * Math.pow(2, -detune * 0.5 / 1200)) / this.sr, 0.49);

        // Generate waveform
        const genWave = (phase, dt, type) => {
            if (type < 0.5) return Math.sin(phase * Math.PI * 2);
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

        const osc1 = genWave(this.phase1, dt1, waveType);
        const osc2 = genWave(this.phase2, dt2, waveType);
        const osc3 = genWave(this.phase3, dt3, waveType);

        let val = osc1 * 0.5 + osc2 * 0.35 + osc3 * 0.15;
        if (noise > 0) val += this.getNoise() * noise;

        this.phase1 = (this.phase1 + dt1) % 1.0;
        this.phase2 = (this.phase2 + dt2) % 1.0;
        this.phase3 = (this.phase3 + dt3) % 1.0;

        // Filter envelope modulation
        this.filterEnvValue = this.filterEnvValue * this.filterEnvSpeed + this.filterEnvTarget * (1 - this.filterEnvSpeed);
        const modulatedCutoff = cutoff * (0.3 + this.filterEnvValue * 0.7);

        // Ladder filter
        const g = Math.tan(Math.PI * Math.min(modulatedCutoff, this.sr * 0.45) / this.sr);
        const k = resonance * 3.8;
        const f = this.synthFilter;

        const clamp = (x) => isFinite(x) ? Math.max(-8, Math.min(8, x)) : 0;
        const sat = (x) => Math.tanh(x);

        const input = clamp((val - sat(f.d4 * k)) / (1.0 + g));
        f.d1 = clamp(f.d1 + g * (sat(input) - sat(f.d1)));
        f.d2 = clamp(f.d2 + g * (sat(f.d1) - sat(f.d2)));
        f.d3 = clamp(f.d3 + g * (sat(f.d2) - sat(f.d3)));
        f.d4 = clamp(f.d4 + g * (sat(f.d3) - sat(f.d4)));

        let out = f.d4;

        // Saturation
        out = this.softClip(out * (1 + saturation));

        // Chorus
        this.lfoPhase = (this.lfoPhase + 0.4 / this.sr) % 1.0;
        const lfo1 = Math.sin(this.lfoPhase * Math.PI * 2);
        const lfo2 = Math.sin((this.lfoPhase + 0.25) * Math.PI * 2);

        this.chorusBufferL[this.chorusPtr] = out;
        this.chorusBufferR[this.chorusPtr] = out;

        const baseDelay = this.sr * 0.012;
        const modDepth = this.sr * 0.003;

        const getDelayed = (buf, ptr, delay, size) => {
            const p = ((ptr - delay) % size + size) % size;
            const i0 = Math.floor(p);
            const frac = p - i0;
            return buf[i0] * (1 - frac) + buf[(i0 + 1) % size] * frac;
        };

        const wetL = getDelayed(this.chorusBufferL, this.chorusPtr, baseDelay + lfo1 * modDepth, this.chorusSize);
        const wetR = getDelayed(this.chorusBufferR, this.chorusPtr, baseDelay + lfo2 * modDepth, this.chorusSize);

        this.chorusPtr = (this.chorusPtr + 1) % this.chorusSize;

        return {
            left: out + wetL * chorusMix * 0.6,
            right: out + wetR * chorusMix * 0.6
        };
    }

    // === KICK DRUM SYNTHESIS ===
    // 808-style: Sine body with pitch sweep + click transient

    processKick(freq) {
        // Body: sine with pitch envelope (freq param controls starting pitch)
        const bodyFreq = freq; // Will be swept externally via frequency param
        const body = Math.sin(this.kickPhase * Math.PI * 2);
        this.kickPhase = (this.kickPhase + bodyFreq / this.sr) % 1.0;

        // Click transient: short high-freq burst
        const clickFreq = 1200;
        const click = Math.sin(this.kickClickPhase * Math.PI * 2) * 0.3;
        this.kickClickPhase = (this.kickClickPhase + clickFreq / this.sr) % 1.0;

        // Mix with soft saturation for warmth
        let out = this.softClip((body * 0.85 + click * 0.15) * 1.2);

        return { left: out, right: out };
    }

    // === SNARE DRUM SYNTHESIS ===
    // Layered: Body (200Hz) + Snap (high transient) + Filtered noise

    processSnare(freq) {
        // Body: pitched sine around 180-200Hz
        const bodyFreq = freq || 185;
        const body = Math.sin(this.snareBodyPhase * Math.PI * 2) * 0.4;
        this.snareBodyPhase = (this.snareBodyPhase + bodyFreq / this.sr) % 1.0;

        // Noise component - bandpass filtered for "snare wire" sound
        let noise = this.getNoise();

        // Bandpass: LP at 8kHz then HP at 2kHz
        const nf = this.snareNoiseFilter;

        // Lowpass 8kHz (2-pole)
        const lpFreq = 8000;
        const lpRc = 1.0 / (2.0 * Math.PI * lpFreq);
        const lpAlpha = (1.0 / this.sr) / (lpRc + 1.0 / this.sr);
        nf.lp1 = nf.lp1 + lpAlpha * (noise - nf.lp1);
        nf.lp2 = nf.lp2 + lpAlpha * (nf.lp1 - nf.lp2);

        // Highpass 2kHz (2-pole)
        const hpFreq = 2000;
        const hpRc = 1.0 / (2.0 * Math.PI * hpFreq);
        const hpAlpha = hpRc / (hpRc + 1.0 / this.sr);
        const hpIn = nf.lp2;
        const hp1Out = hpAlpha * ((nf.hp1prev || 0) + hpIn - (nf.hp1in || 0));
        nf.hp1in = hpIn;
        nf.hp1prev = hp1Out;
        const hp2Out = hpAlpha * ((nf.hp2prev || 0) + hp1Out - (nf.hp2in || 0));
        nf.hp2in = hp1Out;
        nf.hp2prev = hp2Out;

        const filteredNoise = hp2Out * 0.6;

        // Mix body and noise
        let out = this.softClip(body + filteredNoise);

        return { left: out, right: out };
    }

    // === HI-HAT SYNTHESIS ===
    // Metallic: 6 detuned square waves, high-pass filtered heavily

    processHiHat(freq) {
        const baseFreq = freq || 6000;
        let sum = 0;

        // 6 metallic partials
        for (let i = 0; i < 6; i++) {
            const f = baseFreq * this.hhRatios[i];
            const dt = f / this.sr;
            // Use pulse wave with some width variation for less harshness
            const pulseWidth = 0.4 + i * 0.05;
            sum += this.hhPhases[i] < pulseWidth ? 0.5 : -0.5;
            this.hhPhases[i] = (this.hhPhases[i] + dt) % 1.0;
        }

        let out = sum / 6.0;

        // Add some noise for shimmer
        out = out * 0.7 + this.getNoise() * 0.3;

        // High-pass filter at 7kHz to remove low-end harshness
        const hf = this.hhFilter;
        const hpFreq = 7000;
        const hpRc = 1.0 / (2.0 * Math.PI * hpFreq);
        const hpAlpha = hpRc / (hpRc + 1.0 / this.sr);

        // 2-pole highpass
        const hp1 = hpAlpha * ((hf.hp1prev || 0) + out - (hf.hp1in || 0));
        hf.hp1in = out;
        hf.hp1prev = hp1;
        const hp2 = hpAlpha * ((hf.hp2prev || 0) + hp1 - (hf.hp2in || 0));
        hf.hp2in = hp1;
        hf.hp2prev = hp2;

        // Gentle lowpass at 12kHz to tame extreme highs
        const lpFreq = 12000;
        const lpRc = 1.0 / (2.0 * Math.PI * lpFreq);
        const lpAlpha = (1.0 / this.sr) / (lpRc + 1.0 / this.sr);
        hf.lp1 = (hf.lp1 || 0) + lpAlpha * (hp2 - (hf.lp1 || 0));
        hf.lp2 = (hf.lp2 || 0) + lpAlpha * (hf.lp1 - (hf.lp2 || 0));

        out = this.softClip(hf.lp2 * 1.5);

        return { left: out, right: out };
    }

    // === MAIN PROCESS ===

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        if (!output || !output[0]) return true;

        const outL = output[0];
        const outR = output[1] || output[0];
        const numFrames = outL.length;

        const getP = (name, i, def) => {
            const arr = parameters[name];
            if (!arr || !arr.length) return def;
            return arr.length > 1 ? arr[i] : arr[0];
        };

        for (let i = 0; i < numFrames; i++) {
            const mode = getP("mode", i, 0);
            const freq = getP("frequency", i, 440);
            const cutoff = getP("cutoff", i, 1000);
            const resonance = Math.min(getP("resonance", i, 0.5), 0.92);
            const waveform = getP("waveform", i, 1);
            const detune = getP("detune", i, 10);
            const noise = getP("noise", i, 0);
            const saturation = getP("saturation", i, 0.5);
            const chorusMix = getP("chorusMix", i, 0.3);

            let result;

            if (mode < 0.5) {
                // Synth
                result = this.processSynth(freq, cutoff, resonance, waveform, detune, noise, saturation, chorusMix);
            } else if (mode < 1.5) {
                // Kick
                result = this.processKick(freq);
            } else if (mode < 2.5) {
                // Snare
                result = this.processSnare(freq);
            } else {
                // Hi-hat
                result = this.processHiHat(freq);
            }

            // DC block final output
            const dcBlocked = this.dcBlock((result.left + result.right) * 0.5);
            outL[i] = mode < 0.5 ? result.left : dcBlocked;
            outR[i] = mode < 0.5 ? result.right : dcBlocked;
        }

        return true;
    }

    static get parameterDescriptors() {
        return [
            { name: "frequency", defaultValue: 440, minValue: 20, maxValue: 20000 },
            { name: "cutoff", defaultValue: 1000, minValue: 20, maxValue: 20000 },
            { name: "resonance", defaultValue: 0.5, minValue: 0, maxValue: 0.92 },
            { name: "waveform", defaultValue: 1, minValue: 0, maxValue: 3 },
            { name: "detune", defaultValue: 10, minValue: 0, maxValue: 100 },
            { name: "noise", defaultValue: 0, minValue: 0, maxValue: 1 },
            { name: "mode", defaultValue: 0, minValue: 0, maxValue: 3 },
            { name: "saturation", defaultValue: 0.5, minValue: 0, maxValue: 2 },
            { name: "chorusMix", defaultValue: 0.3, minValue: 0, maxValue: 1 }
        ];
    }
}

registerProcessor("shed-processor", ShedProcessor);

/**
 * SHED FX Processor - Classic Pedal Effects
 * Supports: Delay, Drive, Reverb
 */
class ShedFXProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.sr = sampleRate;
        
        // Delay State
        this.delayBufferLen = this.sr * 2; // 2 seconds max
        this.delayBufferL = new Float32Array(this.delayBufferLen);
        this.delayBufferR = new Float32Array(this.delayBufferLen);
        this.delayWritePtr = 0;

        // Reverb State (Simple Comb Filters for "Spring" sound)
        this.combs = [
            { buf: new Float32Array(2000), ptr: 0, fb: 0.8 },
            { buf: new Float32Array(3000), ptr: 0, fb: 0.75 },
            { buf: new Float32Array(4000), ptr: 0, fb: 0.7 }
        ];
        this.allpass = [
             { buf: new Float32Array(500), ptr: 0 },
             { buf: new Float32Array(700), ptr: 0 }
        ];
    }

    softClip(x) {
        return Math.tanh(x);
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || !input[0] || !output || !output[0]) return true;

        const numFrames = input[0].length;
        const inL = input[0];
        const inR = input[1] || input[0];
        const outL = output[0];
        const outR = output[1] || output[0];

        const getP = (name, i, def) => {
            const arr = parameters[name];
            if (!arr || !arr.length) return def;
            return arr.length > 1 ? arr[i] : arr[0];
        };

        for (let i = 0; i < numFrames; i++) {
            let L = inL[i];
            let R = inR[i];

            // 1. DISTORTION (Drive)
            const drive = getP("drive", i, 0);
            if (drive > 0) {
                const k = drive * 10;
                // Symmetrical soft clipping
                L = (Math.atan(L * (1 + k)) / (Math.PI / 2)) * 0.8;
                R = (Math.atan(R * (1 + k)) / (Math.PI / 2)) * 0.8;
            }

            // 2. DELAY
            const delayTime = getP("delayTime", i, 0.3); // Seconds
            const delayFeedback = getP("delayFeedback", i, 0.4);
            const delayMix = getP("delayMix", i, 0.3);

            if (delayMix > 0) {
                const delaySamples = Math.floor(delayTime * this.sr);
                
                // Read from circular buffer
                const readPtr = (this.delayWritePtr - delaySamples + this.delayBufferLen) % this.delayBufferLen;
                const delL = this.delayBufferL[readPtr];
                const delR = this.delayBufferR[readPtr];

                // Write to buffer (Input + Feedback)
                this.delayBufferL[this.delayWritePtr] = L + delL * delayFeedback;
                this.delayBufferR[this.delayWritePtr] = R + delR * delayFeedback;

                // Advance pointer
                this.delayWritePtr = (this.delayWritePtr + 1) % this.delayBufferLen;

                // Mix
                L = L + (delL * delayMix);
                R = R + (delR * delayMix);
            }

            // 3. REVERB (Simple "Spring" approximation)
            const reverbMix = getP("reverbMix", i, 0.2);
            if (reverbMix > 0) {
                let monoIn = (L + R) * 0.5;
                let verbOut = 0;

                // Parallel Combs
                for (let c of this.combs) {
                    const out = c.buf[c.ptr];
                    c.buf[c.ptr] = monoIn + out * c.fb;
                    c.ptr = (c.ptr + 1) % c.buf.length;
                    verbOut += out;
                }

                // Mix Reverb
                L += verbOut * reverbMix * 0.2;
                R += verbOut * reverbMix * 0.2;
            }

            outL[i] = L;
            outR[i] = R;
        }

        return true;
    }

    static get parameterDescriptors() {
        return [
            { name: "drive", defaultValue: 0, minValue: 0, maxValue: 1 },
            { name: "delayTime", defaultValue: 0.3, minValue: 0, maxValue: 1.0 },
            { name: "delayFeedback", defaultValue: 0.4, minValue: 0, maxValue: 0.95 },
            { name: "delayMix", defaultValue: 0, minValue: 0, maxValue: 1 },
            { name: "reverbMix", defaultValue: 0, minValue: 0, maxValue: 1 }
        ];
    }
}

registerProcessor("shed-fx", ShedFXProcessor);
