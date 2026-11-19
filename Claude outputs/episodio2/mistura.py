import json, subprocess, sys
falas=json.load(open(sys.argv[1])); arq=json.load(open('arq.json')); saida=sys.argv[2]; dur=float(sys.argv[3])
ins=[]; filt=[]
for i,f in enumerate(falas):
    k=f['v']+'|'+f['texto']; ins+=['-i','vozes/'+arq[k]]
    ms=int(round(f['t']+40)); filt.append(f"[{i}:a]adelay={ms}|{ms},aresample=44100,pan=stereo|c0=c0|c1=c0[a{i}]")
mix=''.join(f'[a{i}]' for i in range(len(falas)))
filt.append(f"{mix}amix=inputs={len(falas)}:normalize=0:duration=longest,volume=1.0,apad=whole_dur={dur}[m]")
cmd=['ffmpeg','-y','-v','error']+ins+['-filter_complex',';'.join(filt),'-map','[m]','-t',str(dur),'-c:a','aac','-b:a','128k',saida]
subprocess.check_call(cmd)
