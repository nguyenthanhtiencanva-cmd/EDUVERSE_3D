import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import LegacyWorld from '../src/LegacyWorld';
import { useStore } from '../src/store/useStore';
import { getSpiralPose, groundAt, COURTYARD } from '../src/world/lighthouse/layout';
import '../src/index.css';

useStore.getState().setWorldScope('lighthouse');
useStore.setState({quality:'low',qualityAuto:false});

function Review() {
  const state=useStore();
  const timer=useRef();
  const [result,setResult]=useState('Sẵn sàng kiểm tra điều khiển thật của ứng dụng.');
  const stop=()=>{clearTimeout(timer.current);state.setJoystickMove(0,0);};
  function place(where){
    stop();
    if(where==='hill'){state.setWorldScope('lighthouse');return;}
    const t=where==='balcony'?1:0,p=getSpiralPose(t),a=COURTYARD.towerDoor.angle;
    const position=where==='yard'?[4,groundAt(4,10),10]:[p.x+Math.cos(a)*.45,p.y,p.z+Math.sin(a)*.45];
    const level=where==='balcony'?'balcony':'ground';
    useStore.setState({lighthouseLevel:level,spiralProgress:t,cameraMode:'fps',playerTeleport:{position,yaw:where==='yard'?Math.PI:Math.atan2(-Math.cos(a),-Math.sin(a)),level,nonce:performance.now()}});
    setResult('Đã đặt vị trí kiểm tra.');
  }
  function move(direction){
    stop();const before=useStore.getState().spiralProgress;
    state.setJoystickMove(0,direction);setResult('Đang giữ cần điều khiển trong 3 giây…');
    timer.current=setTimeout(()=>{state.setJoystickMove(0,0);const after=useStore.getState().spiralProgress;setResult(`Đã thả cần: ${before.toFixed(5)} → ${after.toFixed(5)}`);},3000);
  }
  function verifyStop(){
    stop();const before=useStore.getState(),p=[...before.playerPosition],t=before.spiralProgress;
    setResult('Đang kiểm tra đứng yên trong 2 giây…');
    timer.current=setTimeout(()=>{const after=useStore.getState();const distance=Math.hypot(...p.map((v,i)=>v-after.playerPosition[i]));setResult(Math.abs(after.spiralProgress-t)<1e-9&&distance<.002?'ĐẠT: thả cần thì nhân vật dừng, không tự leo.':`CHƯA ĐẠT: lệch ${distance.toFixed(4)} m`);},2000);
  }
  return <><LegacyWorld/><aside style={{position:'fixed',left:12,bottom:12,zIndex:70,maxWidth:620,background:'#fff',color:'#152b36',padding:12,borderRadius:10,font:'13px system-ui',boxShadow:'0 2px 12px #0004'}}>
    <strong>Kiểm tra phát triển · Cảnh và bộ điều khiển thật</strong>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',margin:'8px 0'}}>
      {[['hill','Chân đồi'],['yard','Sân mới'],['door','Cửa tháp'],['balcony','Ban công']].map(([where,label])=><button key={where} style={{padding:6,border:'1px solid #8099a8'}} onClick={()=>place(where)}>{label}</button>)}
      <button onClick={()=>move(1)}>Giữ tiến 3 giây</button><button onClick={()=>move(-1)}>Giữ lùi 3 giây</button><button onClick={verifyStop}>Kiểm tra dừng</button>
    </div>
    <div>Tầng: {state.lighthouseLevel} · Tiến độ: {state.spiralProgress.toFixed(5)} · Vị trí: {state.playerPosition.map(n=>n.toFixed(2)).join(', ')}</div>
    <div role="status">{result}</div>
  </aside></>;
}
createRoot(document.getElementById('root')).render(<Review/>);
