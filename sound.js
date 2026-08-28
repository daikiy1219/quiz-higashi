/**
 * SoundEngine - Web Audio API Synthesizer with Level-Up Jingles, Fever Mode & SFX
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmTimer = null;
        this.bgmPlaying = false;
        this.tempo = 130;
        this.isFever = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted && this.bgmPlaying) {
            this.stopBGM();
        }
        return this.isMuted;
    }

    playTone(freq, type = 'sine', duration = 0.15, startVol = 0.3, endVol = 0.001) {
        if (this.isMuted) return;
        this.init();

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(startVol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(endVol, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }

    playTick(isUrgent = false) {
        if (this.isMuted) return;
        const freq = isUrgent ? 980 : 440;
        this.playTone(freq, 'triangle', 0.08, 0.2);
    }

    playClick() {
        this.playTone(650, 'sine', 0.06, 0.25);
    }

    playCorrect() {
        if (this.isMuted) return;
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.18, 0.3);
            }, idx * 60);
        });
    }

    playWrong() {
        if (this.isMuted) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        } catch (e) {}
    }

    // Level Up Jingle ✨
    playLevelUp() {
        if (this.isMuted) return;
        this.init();
        const notes = [440, 554.37, 659.25, 880, 1108.73]; // A4, C#5, E5, A5, C#6
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'square', 0.25, 0.35);
            }, idx * 80);
        });
    }

    // Achievement Sparkle SFX 🌟
    playAchievement() {
        if (this.isMuted) return;
        this.init();
        const notes = [1046.50, 1318.51, 1567.98, 2093.00];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.15, 0.25);
            }, idx * 50);
        });
    }

    playFanfare() {
        if (this.isMuted) return;
        this.init();
        const melody = [
            { f: 523.25, d: 0.15 }, { f: 523.25, d: 0.15 }, { f: 523.25, d: 0.15 },
            { f: 659.25, d: 0.4 },  { f: 783.99, d: 0.4 },  { f: 1046.50, d: 0.8 }
        ];
        let delay = 0;
        melody.forEach(item => {
            setTimeout(() => {
                this.playTone(item.f, 'triangle', item.d, 0.4);
            }, delay * 1000);
            delay += item.d;
        });
    }

    startBGM(isFever = false) {
        if (this.isMuted || this.bgmPlaying) return;
        this.init();
        this.bgmPlaying = true;
        this.isFever = isFever;

        this.tempo = isFever ? 160 : 130;

        const bassLine = isFever ? 
            [174.61, 196.00, 220.00, 261.63, 174.61, 196.00, 261.63, 293.66] :
            [130.81, 130.81, 164.81, 130.81, 174.61, 130.81, 196.00, 164.81];

        const leadLine = isFever ?
            [659.25, 783.99, 880.00, 1046.50, 880.00, 783.99, 659.25, 783.99] :
            [523.25, 0, 659.25, 0, 783.99, 659.25, 523.25, 0];

        let step = 0;
        const sixteenthNoteTime = (60 / this.tempo) / 4;

        this.bgmTimer = setInterval(() => {
            if (!this.bgmPlaying || this.isMuted) return;

            const bassNote = bassLine[step % bassLine.length];
            const leadNote = leadLine[step % leadLine.length];

            if (bassNote > 0) {
                this.playTone(bassNote, 'sawtooth', 0.1, isFever ? 0.18 : 0.12);
            }
            if (leadNote > 0) {
                this.playTone(leadNote, 'square', 0.08, isFever ? 0.12 : 0.06);
            }

            step++;
        }, sixteenthNoteTime * 1000);
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

window.soundEngine = new SoundEngine();
