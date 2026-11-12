"""Prototype: read the LTS4 land-tracer block from a level .bin and return terrain vertices (world metres)."""
import struct,sys,os,subprocess,numpy as np
OOZ='/tmp/ref/ooz2/build/ooz'
def kraken(payload,out_size,tag):
    tmp=f'/home/claude/terrain/_{tag}.in'; out=f'/home/claude/terrain/_{tag}.out'
    open(tmp,'wb').write(struct.pack('<Q',out_size)+payload)
    if os.path.exists(out): os.remove(out)
    r=subprocess.run([OOZ,'-d','-f',tmp,out],capture_output=True,text=True,timeout=300)
    if not os.path.exists(out): raise RuntimeError('ooz failed: '+(r.stdout+r.stderr)[-300:])
    d=open(out,'rb').read(); os.remove(tmp); os.remove(out); return d
def find_lts4(b):
    o=0
    while True:
        o=b.find(b'LTS4',o)
        if o<0: return None
        hdr=struct.unpack_from('<I',b,o+4)[0]; fmt=hdr>>30; ln=hdr&0x3fffffff
        if fmt in (1,2) and 16<ln<len(b)-o:
            if fmt==2:
                src=struct.unpack_from('<I',b,o+8)[0]
                if 0<src<(256<<20): return o,fmt,ln,src
            else: return o,fmt,ln,0
        o+=4
def read_lts4(path,stem):
    b=open(path,'rb').read()
    f=find_lts4(b)
    if not f: return None
    o,fmt,ln,src=f
    if fmt==2: d=kraken(b[o+12:o+8+ln],src,stem)
    else:
        import zstandard; d=zstandard.ZstdDecompressor().decompress(b[o+8:o+8+ln],max_output_size=1<<30)
    assert d[:4]==b'LTS4', d[:8]
    ver,cx,cy,cs=struct.unpack_from('<iiif',d,4); org=struct.unpack_from('<3f',d,20); bb=struct.unpack_from('<6f',d,32)
    p=56; verts=[]; cells=0
    for ci in range(cx*cy):
        has=struct.unpack_from('<i',d,p)[0]; p+=4
        if not has: continue
        scale=struct.unpack_from('<4f',d,p); ofs=struct.unpack_from('<4f',d,p+16); p+=32
        magic,version,vstride,leafsz,treeBytes,vcount=struct.unpack_from('<IHBBII',d,p)
        assert magic==struct.unpack('<I',b'iLBd')[0] or d[p:p+4] in (b'dBLi',b'iLBd'), d[p:p+4]
        p+=40; ioflags=0
        if version>=2: ioflags=struct.unpack_from('<I',d,p)[0]; p+=4
        raw=np.frombuffer(d,dtype='<u8',count=vcount,offset=p); p+=vcount*vstride
        # tree stream
        dst=0; leaves=0
        stack_guard=0
        while dst<treeBytes:
            # iterative pre-order parse of one top-level subtree
            pending=1
            while pending:
                cc=d[p]; p+=1; pending-=1
                if cc==0 or cc==0xFF: p+=16; dst+=leafsz; leaves+=1
                elif cc in (0xFE,0xFD): p+=8; dst+=leafsz; leaves+=1
                else: dst+=16; pending+=cc
        assert dst==treeBytes,(dst,treeBytes)
        if ioflags&1: p+=leaves*2
        x=(raw&0x1FFFFF).astype(np.float64)/32; y=((raw>>21)&0x1FFFFF).astype(np.float64)/32; z=((raw>>42)&0x1FFFFF).astype(np.float64)/32
        verts.append(np.stack([(x-ofs[0])/scale[0],(y-ofs[1])/scale[1],(z-ofs[2])/scale[2]],axis=1)); cells+=1
    assert p==len(d),(p,len(d))
    v=np.concatenate(verts)
    return dict(cellsX=cx,cellsY=cy,cellSize=cs,origin=org,bbox=bb,cells=cells,verts=v,codec=fmt,compressed=ln,raw=len(d))
if __name__=='__main__':
    for path in sys.argv[1:]:
        stem=os.path.basename(path)[:-4]; r=read_lts4(path,stem)
        if not r: print(stem,'no LTS4'); continue
        v=r['verts']; print(stem,'codec',r['codec'],'compressed',r['compressed'],'raw',r['raw'],'cells',r['cellsX'],'x',r['cellsY'],'size',r['cellSize'],'origin',r['origin'],'bbox',[round(a) for a in r['bbox']],'cells with geometry',r['cells'],'vertices',len(v))
        print('   x',v[:,0].min().round(),v[:,0].max().round(),'y',v[:,1].min().round(1),v[:,1].max().round(1),'z',v[:,2].min().round(),v[:,2].max().round())
        np.save(f'/home/claude/terrain/{stem}.verts.npy',v.astype(np.float32))
