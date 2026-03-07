let audioCtx = null;
let currentNodes = [];

const getCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
};

export const stopSound = () => {
  currentNodes.forEach(n => { try { n.stop(); } catch(e) {} });
  currentNodes = [];
};

const playNote = (freq, type, gain, start, duration, ctx, dest) => {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode); gainNode.connect(dest);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.3);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.1);
  currentNodes.push(osc);
};

export const PLANET_SOUNDS = {
  1: () => { // Mathematics - precise digital bleeps
    const ctx = getCtx(), dest = ctx.destination;
    [261,329,392,523].forEach((f,i) => playNote(f,"square",0.08,i*0.4,1.5,ctx,dest));
  },
  2: () => { // Literature - soft flowing sine waves
    const ctx = getCtx(), dest = ctx.destination;
    [220,277,330,440,554].forEach((f,i) => playNote(f,"sine",0.06,i*0.6,3,ctx,dest));
  },
  3: () => { // Science - electronic bubbling
    const ctx = getCtx(), dest = ctx.destination;
    [180,360,540,270,450].forEach((f,i) => playNote(f,"sawtooth",0.04,i*0.3,1.2,ctx,dest));
  },
  4: () => { // History - deep ancient tones
    const ctx = getCtx(), dest = ctx.destination;
    [110,138,165,220].forEach((f,i) => playNote(f,"sine",0.1,i*0.8,4,ctx,dest));
  },
  5: () => { // Music - melodic harmonic
    const ctx = getCtx(), dest = ctx.destination;
    [523,659,784,1046,784,659].forEach((f,i) => playNote(f,"sine",0.07,i*0.35,1.5,ctx,dest));
  },
  6: () => { // Languages - varied rhythmic
    const ctx = getCtx(), dest = ctx.destination;
    [320,400,480,360,440,520].forEach((f,i) => playNote(f,"triangle",0.06,i*0.25,1,ctx,dest));
  },
  7: () => { // Geography - sweeping world tones
    const ctx = getCtx(), dest = ctx.destination;
    [240,300,360,480,300,240].forEach((f,i) => playNote(f,"sine",0.07,i*0.45,2.5,ctx,dest));
  },
  8: () => { // Commerce - sharp transactional
    const ctx = getCtx(), dest = ctx.destination;
    [330,415,494,330,415].forEach((f,i) => playNote(f,"square",0.06,i*0.3,1.2,ctx,dest));
  },
};

export const SATELLITE_SOUNDS = {
  s1: () => { // Physics - electric zaps
    const ctx = getCtx(), dest = ctx.destination;
    [180,360,540,270,450].forEach((f,i) => playNote(f,"sawtooth",0.05,i*0.3,1.2,ctx,dest));
  },
  s2: () => { // Chemistry - bubbling pops
    const ctx = getCtx(), dest = ctx.destination;
    [200,300,400,500,300].forEach((f,i) => playNote(f,"triangle",0.05,i*0.35,1.5,ctx,dest));
  },
  s3: () => { // Biology - organic pulses
    const ctx = getCtx(), dest = ctx.destination;
    [260,330,390,520,390].forEach((f,i) => playNote(f,"sine",0.06,i*0.4,2,ctx,dest));
  },
  s4: () => { // Computer Science - digital beeps
    const ctx = getCtx(), dest = ctx.destination;
    [440,550,660,880,660,550].forEach((f,i) => playNote(f,"square",0.05,i*0.2,0.8,ctx,dest));
  },
};
