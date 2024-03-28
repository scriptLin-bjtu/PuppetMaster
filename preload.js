const {ipcRenderer,contextBridge}=require('electron');
//事件流传给主进程递归
let index=0;
let datas=[];
function senddata(){
	if (index >= datas.length) {
	        console.log('事件发送完毕');
			document.getElementById('console_platform').textContent+='执行完毕.\n';
			index=0;
			datas=[];
	        return;
	    }
	    const event = datas[index];
	    ipcRenderer.send(event.eventtype,event.data);
}
contextBridge.exposeInMainWorld('api',{
	match:(arg)=>{
		datas=arg;
		senddata();
	},
	help:()=>{
		ipcRenderer.send('help');
	},
	screenshot:()=>{
		ipcRenderer.send('screenshot');
	},
	clean:()=>{
		ipcRenderer.send('clean');
	},
	save:(arg)=>{
		ipcRenderer.send('save',arg);
	},
	openChildWindow:(arg)=>{
		//console.log(arg);
		ipcRenderer.send('openChildWindow',arg);
	}
});
contextBridge.exposeInMainWorld('childapi',{
	click:(xRatio,yRatio)=>{
		//console.log('click----');
		ipcRenderer.send('click', xRatio, yRatio);
	}
});
ipcRenderer.on('suc_match',(event,arg)=>{
	const textarea=document.getElementById('console_platform');
	textarea.textContent+=arg;
	index++;
	senddata();
});
ipcRenderer.on('fal_match',(event,arg)=>{
	const textarea=document.getElementById('console_platform');
	textarea.textContent+=arg;
	index++;
	senddata();
});
ipcRenderer.on('suc_scoll',(event,arg)=>{
	const textarea=document.getElementById('console_platform');
	textarea.textContent+=arg;
	index++;
	senddata();
});
ipcRenderer.on('suc_type',(event,arg)=>{
	const textarea=document.getElementById('console_platform');
	textarea.textContent+=arg;
	index++;
	senddata();
});
ipcRenderer.on('fal_type',(event,arg)=>{
	const textarea=document.getElementById('console_platform');
	textarea.textContent+=arg;
	index++;
	senddata();
});
ipcRenderer.on('suc_wait',(event,arg)=>{
	const textarea=document.getElementById('console_platform');
	textarea.textContent+=arg;
	index++;
	senddata();
});
ipcRenderer.on('cut_suc',(event,arg)=>{
    document.getElementById('imgshow').src=arg;
	window.dispatchEvent(new CustomEvent('imgpath_changed', { detail: arg }));
});
ipcRenderer.on('imageURL',(event,arg)=>{
	//console.log(arg);
    document.getElementById('image').src=arg;
});
ipcRenderer.on('clickedPoint',(event,arg)=>{
	//console.log(arg);
	window.dispatchEvent(new CustomEvent('targetpoint_changed', { detail: arg }));
});