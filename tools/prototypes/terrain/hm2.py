"""Prototype: decode a Dagor HM2 compressed heightmap (single- or multi-chunk) from a level .bin."""
import struct,sys,os,re,numpy as np
sys.path.insert(0,'/home/claude/scripts')
from lts4 import kraken
HIER=[0,1,5,21,85,341,1365,5461,21845,87381,349525,1398101,5592405,22369621,89478485]
def read_block(b,p,out_size,tag):
    hdr=struct.unpack_from('<I',b,p)[0]; fmt=hdr>>30; ln=hdr&0x3fffffff; payload=b[p+4:p+4+ln]
    if fmt==2: d=kraken(payload,out_size,tag)
    elif fmt==1:
        import zstandard; d=zstandard.ZstdDecompressor().decompress(payload,max_output_size=out_size)
    else: raise RuntimeError(f'codec {fmt}')
    assert len(d)==out_size,(len(d),out_size)
    return d,p+4+ln
def read_hm2(path,stem,want_min_extent=0):
    b=open(path,'rb').read(); best=None
    for m in re.finditer(b'HM2\0',b):
        o=m.start()+3
        cell,hMin,hScale,ofsX,ofsZ,w,h=struct.unpack_from('<fffffii',b,o)
        ver=(w>>24)&0xff; w&=0xffffff; mirror=(h>>31)&1; h&=0x7fffffff
        if not (0<cell<1e4 and 0<w<=16384 and 0<h<=16384 and ver in (1,2)): continue
        p=o+44; chunkSz=0
        if ver==2: chunkSz=struct.unpack_from('<I',b,p)[0]; p+=4
        if best is None or cell*w>best[0]: best=(cell*w,dict(cell=cell,hMin=hMin,hScale=hScale,ofsX=ofsX,ofsZ=ofsZ,w=w,h=h,ver=ver,mirror=mirror,chunkSz=chunkSz,p=p))
    if not best or best[0]<want_min_extent: return None
    H=best[1]; w,h=H['w'],H['h']; shift=H['chunkSz']&0xFF or 3; hrb=1<<((H['chunkSz']>>8)&0xF); chunk_sz=H['chunkSz']&~0xFFF
    bw,bh=w>>shift,h>>shift; bsz=1<<(2*shift); nblocks=bw*bh
    levels=(w//hrb).bit_length()-1 if hrb>1 else 0
    hrb_bytes=HIER[levels]*16 if levels else 0
    p=H['p']
    if chunk_sz==0:
        total=((nblocks*(4+bsz))+0xF & ~0xF)+hrb_bytes
        d,p=read_block(b,p,total,stem); info=np.frombuffer(d,dtype='<u2',count=nblocks*2).reshape(nblocks,2); var=np.frombuffer(d,dtype=np.uint8,count=nblocks*bsz,offset=nblocks*4).reshape(nblocks,bsz)
    else:
        d0,p=read_block(b,p,nblocks*4+hrb_bytes,stem); info=np.frombuffer(d0,dtype='<u2',count=nblocks*2).reshape(nblocks,2)
        bpc=chunk_sz>>(2*shift); parts=[]
        for c in range((nblocks+bpc-1)//bpc):
            n=min(bpc,nblocks-c*bpc); dc,p=read_block(b,p,n*bsz,stem); parts.append(np.frombuffer(dc,dtype=np.uint8))
        var=np.concatenate(parts).reshape(nblocks,bsz)
    var=np.cumsum(var,axis=1,dtype=np.uint8)  # delta decode with u8 wrap
    mn=info[:,0].astype(np.uint32)[:,None]; dl=info[:,1].astype(np.uint32)[:,None]
    raw=np.where(dl==0,mn,mn+(var.astype(np.uint32)*dl+127)//255)
    bs=1<<shift
    grid=raw.reshape(bh,bw,bs,bs).transpose(0,2,1,3).reshape(h,w)
    height=H['hMin']+grid.astype(np.float32)*H['hScale']/65535.0
    H['height']=height; return H
if __name__=='__main__':
    for path in sys.argv[1:]:
        stem=os.path.basename(path)[:-4]; r=read_hm2(path,stem)
        if not r: print(stem,'no HM2'); continue
        hgt=r.pop('height'); print(stem,{k:v for k,v in r.items() if k!='p'},'height range',float(hgt.min()),float(hgt.max()),'mean',float(hgt.mean()))
        np.save(f'/home/claude/terrain/{stem}.hm2.npy',hgt); import json; json.dump({k:v for k,v in r.items() if k!='p'},open(f'/home/claude/terrain/{stem}.hm2.json','w'))
