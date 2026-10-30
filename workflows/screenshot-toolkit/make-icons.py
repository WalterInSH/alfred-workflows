#!/usr/bin/env python3
"""Generate simple, dependency-free PNG icons used by the workflow."""
import struct, zlib
from pathlib import Path
root = Path(__file__).resolve().parent
(root/'icons').mkdir(exist_ok=True)
for name in ('icon', 'full', 'area', 'window', 'clipboard', 'file'):
    n=128
    pix=[[(36, 88, 152, 255) for x in range(n)] for y in range(n)]
    def line(x1,y1,x2,y2,width=5):
        dx=x2-x1; dy=y2-y1; steps=max(abs(dx),abs(dy),1)
        for i in range(steps+1):
            x=round(x1+dx*i/steps); y=round(y1+dy*i/steps)
            for yy in range(max(0,y-width//2),min(n,y+width//2+1)):
                for xx in range(max(0,x-width//2),min(n,x+width//2+1)): pix[yy][xx]=(255,255,255,255)
    def rect(x1,y1,x2,y2):
        line(x1,y1,x2,y1);line(x2,y1,x2,y2);line(x2,y2,x1,y2);line(x1,y2,x1,y1)
    if name in ('icon','full','window'):
        rect(23,32,105,91)
        if name=='window': line(23,46,105,46)
        if name=='icon':
            rect(47,47,81,76); line(52,26,76,26)
    elif name=='area':
        for a,b in ((25,39),(49,63),(73,87),(97,103)):
            line(a,25,b,25);line(a,103,b,103);line(25,a,25,b);line(103,a,103,b)
    elif name=='clipboard':
        rect(34,26,94,105);rect(49,20,79,34);line(47,55,81,55);line(47,70,81,70);line(47,85,72,85)
    else:
        line(22,39,50,39);line(50,39,57,47);line(57,47,106,47);line(106,47,100,96);line(100,96,22,96);line(22,96,22,39)
    raw=b''.join(b'\0'+bytes(c for pixel in row for c in pixel) for row in pix)
    def chunk(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    data=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',n,n,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')
    (root/('icon.png' if name=='icon' else 'icons/'+name+'.png')).write_bytes(data)
