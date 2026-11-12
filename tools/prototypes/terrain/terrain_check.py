import sys,json,math,numpy as np
sys.path.insert(0,'/home/claude/scripts')
from wtr_read import Wtr
from scipy.interpolate import LinearNDInterpolator
from scipy.ndimage import map_coordinates
N=1024; EXT=65536.0
def grid_from_verts(stem):
    v=np.load(f'/home/claude/terrain/{stem}.verts.npy').astype(np.float64)
    # drop duplicate xz (keep max y)
    key=np.round(v[:,[0,2]]*4).astype(np.int64); order=np.lexsort((-v[:,1],key[:,1],key[:,0])); v=v[order]; key=key[order]
    keep=np.ones(len(v),bool); keep[1:]=np.any(key[1:]!=key[:-1],axis=1); v=v[keep]
    f=LinearNDInterpolator(v[:,[0,2]],v[:,1])
    xs=-EXT+(np.arange(N)+0.5)*(2*EXT/N); X,Z=np.meshgrid(xs,xs)   # row = z, col = x
    g=f(X,Z); 
    if np.isnan(g).any():
        from scipy.interpolate import NearestNDInterpolator
        g2=NearestNDInterpolator(v[:,[0,2]],v[:,1])(X,Z); g=np.where(np.isnan(g),g2,g)
    return g.astype(np.float32),len(v)
def sample(g,x,z):
    c=(np.asarray(x)+EXT)/(2*EXT/N)-0.5; r=(np.asarray(z)+EXT)/(2*EXT/N)-0.5
    return map_coordinates(g,[r,c],order=1,mode='nearest')
def check(stem,session,g,label):
    w=Wtr(f'/home/claude/wtr_out/{session}.wtr'); hag=[]; parked=[]
    for u in w.units:
        if u['kind']!='aircraft': continue
        x=np.array(w.col(u,'x')); y=np.array(w.col(u,'y')); z=np.array(w.col(u,'z')); t=np.array(w.col(u,'t'),dtype=np.float64)
        h=y-sample(g,x,z); hag.append(h)
        if len(t)>2:
            sp=np.hypot(np.diff(x),np.diff(z))/np.maximum(np.diff(t)/1000,1e-3)
            parked.append(h[1:][sp<1.0])
    hag=np.concatenate(hag); parked=np.concatenate(parked) if parked else np.array([])
    q=lambda a,p: float(np.percentile(a,p)) if len(a) else float('nan')
    print(f'{stem:24s} {label:10s} samples {len(hag):6d}  below ground by >20 m: {100*np.mean(hag<-20):5.2f}%  min {hag.min():7.1f}  1st pct {q(hag,1):7.1f}  | parked samples {len(parked):5d} height above terrain: median {q(parked,50):6.1f}  5–95% {q(parked,5):6.1f}..{q(parked,95):6.1f}')
    return dict(samples=int(len(hag)),below20=float(np.mean(hag<-20)),min=float(hag.min()),parked=int(len(parked)),parkedMedian=q(parked,50))
if __name__=='__main__':
    res={}
    for stem,session in (('spain','2b315cb7002e4238'),('avg_northern_india','2b315cb7002e4666'),('air_mysterious_valley','2b315cb7002e6729')):
        g,n=grid_from_verts(stem); np.save(f'/home/claude/terrain/{stem}.grid.npy',g)
        res[stem]=check(stem,session,g,'mesh'); res[stem]['points']=n
    hm=np.load('/home/claude/terrain/air_grand_canyon.hm2.npy')
    for name,gg in (('rows=z',hm),('flip z',hm[::-1]),('flip x',hm[:,::-1]),('transpose',hm.T)):
        g=gg.reshape(N,4,N,4).mean(axis=(1,3)).astype(np.float32)
        r=check('air_grand_canyon','2b315cb7002e6b99',g,name)
        if name=='rows=z': res['air_grand_canyon']=r; np.save('/home/claude/terrain/air_grand_canyon.grid.npy',g)
    json.dump(res,open('/home/claude/terrain/check.json','w'),indent=1)
