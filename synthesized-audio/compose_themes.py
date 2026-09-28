# Original instrumental themes for Galevein, composed in code (no samples, no generation credits).
# D Dorian, drone + bowed lead + frame drum + wind. Two pieces: explore (calm, 72 bpm) and battle (driving, 132 bpm).
import numpy as np, wave, subprocess, sys
SR=44100
def note(n): return 440*2**((n-69)/12)
def env(t,a,r,dur): e=np.minimum(1,t/a)*np.clip((dur-t)/r,0,1); return e
def bowed(f,dur,vib=5,bright=6):
    t=np.arange(int(dur*SR))/SR; ph=2*np.pi*f*t+0.004*f*np.sin(2*np.pi*vib*t)/vib
    s=sum(np.sin(k*ph)/k**1.15 for k in range(1,bright+1))
    return s*env(t,0.25,0.5,dur)
def drone(f,dur):
    t=np.arange(int(dur*SR))/SR
    return (np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*f*1.5*t)+.3*np.sin(2*np.pi*f*2*t))*(0.8+0.2*np.sin(2*np.pi*0.07*t))
def drum(dur,deep=55):
    t=np.arange(int(dur*SR))/SR; return np.sin(2*np.pi*deep*t*np.exp(-t*3))*np.exp(-t*7)+np.random.randn(len(t))*np.exp(-t*40)*.15
def wind(n):
    x=np.random.randn(n); y=np.convolve(x,np.ones(400)/400,'same'); return y*(0.6+0.4*np.sin(np.linspace(0,9,n)))
def render(name,bpm,bars,melody,drumpat,drone_n=38):
    beat=60/bpm; L=int(bars*4*beat*SR); out=np.zeros(L)
    out+=drone(note(drone_n),L/SR)*.16+drone(note(drone_n+7),L/SR)*.08
    out+=wind(L)*.9
    pos=0.0
    while pos*SR<L:
        for (n,b) in melody:
            dur=b*beat; i=int(pos*SR)
            if n is not None and i<L:
                s=bowed(note(n),dur*1.05)*.22; s=s[:L-i]; out[i:i+len(s)]+=s
                s2=bowed(note(n-12),dur*1.05,bright=3)*.08; s2=s2[:L-i]; out[i:i+len(s2)]+=s2
            pos+=dur
            if pos*SR>=L: break
    for k in range(int(bars*4)):
        if drumpat[k%len(drumpat)]:
            i=int(k*beat*SR); d=drum(.6,50 if drumpat[k%len(drumpat)]==2 else 70)*.5*drumpat[k%len(drumpat)]; d=d[:L-i]; out[i:i+len(d)]+=d
    # simple hall reverb (feedback delays)
    for dl,g in [(0.061,.35),(0.137,.28),(0.211,.22),(0.347,.16)]:
        n=int(dl*SR); rev=np.zeros(L); rev[n:]=out[:-n]*g; out+=rev
    fade=int(2*SR); out[:fade]*=np.linspace(0,1,fade); out[-fade:]*=np.linspace(1,0,fade)
    out/=np.max(np.abs(out))*1.05
    pcm=(out*32767).astype(np.int16); st=np.stack([pcm,np.roll(pcm,90)],1)
    with wave.open(f'/tmp/{name}.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i',f'/tmp/{name}.wav','-codec:a','libmp3lame','-b:a','160k',f'synthesized-audio/{name}.mp3'],check=True)
    print(name, round(L/SR,1),'s')
D,E,F,G,A,B,C=62,64,65,67,69,71,72
explore=[(D,2),(A,1),(G,1),(F,2),(E,1),(D,1),(C-12+12,2),(D,1),(E,1),(F,3),(None,1),
         (A,2),(C,1),(B,1),(A,2),(G,1),(F,1),(E,2),(G,1),(F,1),(D,4)]
battle=[(D,.5),(D,.5),(A,1),(D,.5),(D,.5),(C,1),(B,.5),(A,.5),(G,.5),(F,.5),(E,1),(D,1),
        (F,.5),(G,.5),(A,1),(C+12-12,.5),(B,.5),(A,1),(G,.5),(F,.5),(E,.5),(F,.5),(D,2)]
render('theme_explore',72,40,explore,[2,0,1,0])
render('theme_battle',132,64,battle,[2,1,2,1,2,1,2,2])
