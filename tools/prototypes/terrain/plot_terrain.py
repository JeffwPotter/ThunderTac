import sys,json,math,numpy as np
sys.path.insert(0,'/home/claude/scripts')
from wtr_read import Wtr
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, LightSource
from matplotlib.lines import Line2D
MAPS=[('spain','2b315cb7002e4238','Spain'),('avg_northern_india','2b315cb7002e4666','Northern India'),('air_mysterious_valley','2b315cb7002e6729','Mysterious Valley'),('air_grand_canyon','2b315cb7002e6b99','Grand Canyon')]
BL,OR='#1f5fb5','#d9541e'
land=LinearSegmentedColormap.from_list('land',['#eeebe0','#d9d2bd','#bfb497','#a39676','#877a5e'])
fig,axes=plt.subplots(2,2,figsize=(13,13.4),dpi=120); fig.patch.set_facecolor('#fcfcfb')
for ax,(stem,session,title) in zip(axes.flat,MAPS):
    g=np.load(f'/home/claude/terrain/{stem}.grid.npy')
    lvl=json.load(open(f'/home/claude/gamedata/aces/levels/{stem}.blk.json')); water=float(lvl.get('water_level',0) or 0)
    ls=LightSource(azdeg=315,altdeg=45)
    lo,hi=np.percentile(g,1),np.percentile(g,99.5)
    rgb=ls.shade(np.clip(g,lo,hi),cmap=land,vert_exag=2.0,dx=128,dy=128,blend_mode='soft',vmin=lo,vmax=hi)
    wet=g<=water+0.5
    if wet.mean()>0.002: rgb[wet]=(0.78,0.85,0.90,1)
    ax.imshow(rgb,extent=[-65.536,65.536,-65.536,65.536],origin='lower',interpolation='bilinear')
    w=Wtr(f'/home/claude/wtr_out/{session}.wtr'); xs=[];zs=[]
    for u in w.units:
        if u['kind']!='aircraft' or 'player' not in u: continue
        x=np.array(w.col(u,'x'))/1000; z=np.array(w.col(u,'z'))/1000; c=BL if u['team']==1 else OR
        ax.plot(x,z,color='#fcfcfb',lw=2.0,alpha=.55,solid_capstyle='round'); ax.plot(x,z,color=c,lw=1.0,alpha=.95,solid_capstyle='round')
        xs+= [x.min(),x.max()]; zs+=[z.min(),z.max()]
        if u.get('destroyed'): ax.plot(x[-1],z[-1],'X',color=c,ms=6,mec='#0b0b0b',mew=.6)
    cx,cz=(min(xs)+max(xs))/2,(min(zs)+max(zs))/2; half=max(max(xs)-min(xs),max(zs)-min(zs))/2*1.08
    ax.set_xlim(max(-65.5,cx-half),min(65.5,cx+half)); ax.set_ylim(max(-65.5,cz-half),min(65.5,cz+half)); ax.set_aspect('equal')
    ax.set_title(f'{title}   (terrain {lo:.0f}–{hi:.0f} m)',loc='left',fontsize=11.5,color='#0b0b0b',pad=6)
    ax.tick_params(colors='#52514e',labelsize=8)
    for sp in ax.spines.values(): sp.set_color('#c9c8c2')
    ax.set_xlabel('Map X (km)',color='#52514e',fontsize=8.5); ax.set_ylabel('Map Z (km)',color='#52514e',fontsize=8.5)
fig.legend(handles=[Line2D([],[],color=BL,lw=2,label='Team 1 flight paths'),Line2D([],[],color=OR,lw=2,label='Team 2 flight paths'),Line2D([],[],marker='X',color='#52514e',mec='#0b0b0b',ls='',ms=7,label='Shot down')],loc='upper right',bbox_to_anchor=(0.985,0.985),ncol=3,frameon=False,fontsize=9.5,labelcolor='#0b0b0b')
fig.suptitle('Terrain decoded from your game files, with your four matches on top',x=0.02,y=0.985,ha='left',fontsize=14,color='#0b0b0b')
fig.tight_layout(rect=[0,0,1,0.965]); fig.savefig(sys.argv[1])
