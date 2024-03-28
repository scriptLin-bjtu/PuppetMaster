document.addEventListener('DOMContentLoaded',()=>{
	//切换事件区dom
	const tflow_btn=document.getElementById('t-flow');
	const wflow_btn=document.getElementById('w-flow');
	const setting_btn=document.getElementById('setting');
	const tflow_div=document.getElementById('tflowdiv');
	const wflow_div=document.getElementById('wflowdiv');
	const setting_div=document.getElementById('settingdiv');
	//事件流区dom
	const fileInput = document.getElementById('fileInput');
	const startflow_btn = document.getElementById('startflow_btn');
	const edit_btn=document.getElementById('edit_btn');
	//临时事件区dom
	      //
	const tbody=document.getElementById('tablebody');
	const tsetting=document.getElementById('tflow-setting');
	const store_btn=document.getElementById('store_btn');
	const sweep_btn=document.getElementById('sweep_btn');
	      //
	const match_btn=document.getElementById('match_btn');
	const add_btn=document.getElementById('add_btn');
	const imageInput=document.getElementById('imageInput');
	const sc_btn=document.getElementById('screenshot');
	const tg_btn=document.getElementById('set_target');
	const ciInput=document.getElementById('clickintervalInput');
	const ctInput=document.getElementById('clicktimesInput');
	const miInput=document.getElementById('macthintervalInput');
	const rcCheck=document.getElementById('rightmouseCheck');
	const toggleCheck=document.getElementById('togglemouseCheck');
	const toggleInput=document.getElementById('togglemouseInput');
	const mousebtn=document.getElementById('event_mouse');
	const scollbtn=document.getElementById('event_scoll');
	const keybtn=document.getElementById('event_key');
	const breakbtn=document.getElementById('event_break');
	const mousediv=document.getElementById('mousediv');
	const scolldiv=document.getElementById('scolldiv');
	const keydiv=document.getElementById('keydiv');
	const breakdiv=document.getElementById('breakdiv');
	const upscoll=document.getElementById('upscollcheck');
	const downscoll=document.getElementById('downscollcheck');
	const scollinput=document.getElementById('scollinput');
	const keyhelp=document.getElementById('getmoreinf');
	const keytimes=document.getElementById('typetimes');
	const keyinterval=document.getElementById('typeinterval');
	const keyinput=document.getElementById('keytype');
	const suggestions = document.getElementById('suggestions');
	const suggestionList = document.getElementById('suggestionList');
	const togglekeydiv=document.getElementById('togglekey');
	const togglekeycheck=document.getElementById('togglekeyCheck');
	const togglekeyinput=document.getElementById('togglekeyInput');
	const stringdiv=document.getElementById('stringdiv');
	const stringcheck=document.getElementById('stringcheck');
	const stringinput=document.getElementById('stringinput');
	const breaktime=document.getElementById('breaktime');
	let tx,ty;//匹配图片的锚点
	let imgpath='';//匹配图片路径
	let event_flow=[];//事件流
	let eventid=1;//事件类型判断
	let jsonpath='';//本地选择流地址
	let draggedRow = null;//拖拽行进行编辑
	const keys=['shift','esc','alt','control','delete','backspace','enter','tab','capslock','escape','space','up','down','right','left'];//快捷键推荐
	
	window.addEventListener('imgpath_changed', function(event) {
	    // 更新图片路径
	    imgpath=event.detail;
		tg_btn.disabled=false;
	});
	window.addEventListener('targetpoint_changed', function(event) {
	    // 更新锚点
	    tx=event.detail.x;
		ty=event.detail.y;
		alert('描点已更新');
		//console.log('描点更新');
	});
	imageInput.addEventListener('change',(event)=>{
		imgpath=event.target.files[0].path;
		tg_btn.disabled=false;
		document.getElementById('imgshow').src=imgpath;
	});
	//点击切换区域
	tflow_btn.addEventListener('click',()=>{
		tflow_btn.classList.add('active-btn');
		wflow_btn.classList.remove('active-btn');
		setting_btn.classList.remove('active-btn');
		tflow_div.style.display='block';
		wflow_div.style.display='none';
		setting_div.style.display='none';
		tsetting.style.display='block'
	});
	wflow_btn.addEventListener('click',()=>{
		tflow_btn.classList.remove('active-btn');
		wflow_btn.classList.add('active-btn');
		setting_btn.classList.remove('active-btn');
		tflow_div.style.display='none';
		wflow_div.style.display='block';
		setting_div.style.display='none';
		tsetting.style.display='none';
	});
	setting_btn.addEventListener('click',()=>{
		tflow_btn.classList.remove('active-btn');
		wflow_btn.classList.remove('active-btn');
		setting_btn.classList.add('active-btn');
		tflow_div.style.display='none';
		wflow_div.style.display='none';
		setting_div.style.display='block';
		tsetting.style.display='none';
	});
	//点击上传到任务流
	add_btn.addEventListener('click',()=>{
		addData(eventid);
	});
	//拖拽行进行编辑
	tbody.addEventListener('dragstart',(e)=>{
		const target = e.target.closest('tr');
		    if (target) {
		      draggedRow = target;
		      setTimeout(() => {
		        draggedRow.classList.add('dragging');
		      }, 0);
		    }
	});
	tbody.addEventListener('dragend', () => {
	    if (draggedRow) {
	      draggedRow.classList.remove('dragging');
	      draggedRow = null;
		  // 更新数据数组
			updateDataArray();
	    }
	});
	tbody.addEventListener('dragover', (e) => {
	    e.preventDefault();
	}); 
	tbody.addEventListener('drop', (e) => {
	    e.preventDefault();
	    const target = e.target.closest('tr');
	    if (draggedRow && target) {
	      const draggedIndex = Array.from(tbody.children).indexOf(draggedRow);
	      const targetIndex = Array.from(tbody.children).indexOf(target);
	      if (targetIndex > draggedIndex) {
	        tbody.insertBefore(draggedRow, target.nextSibling);
	      } else {
	        tbody.insertBefore(draggedRow, target);
	      }
	    }
	});
	function updateDataArray() {
	    const rows = Array.from(tbody.children);
	    const newDataArray = [];
	    rows.forEach((row, index) => {
	        // 找到当前行的数据在数组中的索引
	        const dataIndex = parseInt(row.dataset.index);
	        // 根据索引获取数据数组中的元素，并添加到新的数组中
	        newDataArray.push(event_flow[dataIndex]);
	        // 更新当前行的索引值
	        row.dataset.index = index;
	    });
	    // 更新数据数组为新的数组
	    event_flow = newDataArray;
		console.log(event_flow);
	}
	//点击上传数据
	match_btn.addEventListener('click',()=>{
		document.getElementById('console_platform').textContent+='开始执行...\n';
		window.api.match(event_flow);
	});
	//切换事件模块
	mousebtn.addEventListener('click',()=>{
		mousediv.style.display='block';
		scolldiv.style.display='none';
		keydiv.style.display='none';
		breakdiv.style.display='none';
		eventid=1;
		mousebtn.classList.add('active-btn');
		scollbtn.classList.remove('active-btn');
		keybtn.classList.remove('active-btn');
		breakbtn.classList.remove('active-btn');
	});
	scollbtn.addEventListener('click',()=>{
		mousediv.style.display='none';
		scolldiv.style.display='block';
		keydiv.style.display='none';
		breakdiv.style.display='none';
		eventid=2;
		mousebtn.classList.remove('active-btn');
		scollbtn.classList.add('active-btn');
		keybtn.classList.remove('active-btn');
		breakbtn.classList.remove('active-btn');
	});
	keybtn.addEventListener('click',()=>{
		mousediv.style.display='none';
		scolldiv.style.display='none';
		keydiv.style.display='block';
		breakdiv.style.display='none';
		eventid=3;
		mousebtn.classList.remove('active-btn');
		scollbtn.classList.remove('active-btn');
		keybtn.classList.add('active-btn');
		breakbtn.classList.remove('active-btn');
	});
	breakbtn.addEventListener('click',()=>{
		mousediv.style.display='none';
		scolldiv.style.display='none';
		keydiv.style.display='none';
		breakdiv.style.display='block';
		eventid=4;
		mousebtn.classList.remove('active-btn');
		scollbtn.classList.remove('active-btn');
		keybtn.classList.remove('active-btn');
		breakbtn.classList.add('active-btn');
	});
	//截图
	sc_btn.addEventListener('click',()=>{
		window.api.screenshot();
	});
	//设置匹配图片锚点
	tg_btn.addEventListener('click',()=>{
		window.api.openChildWindow(imgpath);
	});
	//按键帮助
	keyhelp.addEventListener('click',()=>{
		window.api.help();
	});
	//点击长按后显示长按时长
	toggleCheck.addEventListener('change',()=>{
		if(event.target.checked){
			document.getElementById('toggle').style.display='block';
		}else{
			document.getElementById('toggle').style.display='none';
		}
	});
	togglekeycheck.addEventListener('change',()=>{
		if(stringcheck.checked){
			stringcheck.checked=false;
			stringdiv.style.display='none';
		}
		if(event.target.checked){
			togglekeydiv.style.display='block';
		}else{
			togglekeydiv.style.display='none';
		}
	});
	stringcheck.addEventListener('change',()=>{
		if(togglekeycheck.checked){
			togglekeycheck.checked=false;
			togglekeydiv.style.display='none';
		}
		if(event.target.checked){
			stringdiv.style.display='block';
		}else{
			stringdiv.style.display='none';
		}
	});
	//按键输入框模糊搜素提示
	keyinput.addEventListener('input',()=>{
		const userInput = keyinput.value.toLowerCase().split('+');
		suggestionList.innerHTML='';
		const matches = keys.filter(key => key.toLowerCase().startsWith(userInput[userInput.length-1]));
		matches.forEach(match => {
		    const li = document.createElement('li');
		    li.textContent = match;
		    suggestionList.appendChild(li);
		});
		if (matches.length > 0) {
		    suggestions.style.display = 'block';
		} else {
		    suggestions.style.display = 'none';
		}
	});
	suggestionList.addEventListener('click', (event) => {
		const userInput = keyinput.value.toLowerCase().split('+');
	      if (event.target.tagName === 'LI') {
			userInput[userInput.length-1]=event.target.textContent;
	        keyinput.value = userInput.join('+');
	        suggestions.style.display = 'none';
	      }
	});
	//监听键盘事件根据数字自动填充
	document.addEventListener('keydown',(event)=>{
		if(suggestions.style.display==='block'){
			const userInput = keyinput.value.toLowerCase().split('+');
			const matches = keys.filter(key => key.toLowerCase().startsWith(userInput[userInput.length-1]));
			if(event.key>='1'&&event.key<=String(matches.length)){
				userInput[userInput.length-1]=matches[parseInt(event.key) - 1];
				keyinput.value = userInput.join('+');
				suggestions.style.display = 'none';
				event.preventDefault();//防止'shift1'的情况
			}
		}
	});
	// 点击非输入框区域时隐藏建议
	document.addEventListener('click', (event) => {
	    if (!event.target.matches('#keyinput') && !event.target.closest('#suggestions')) {
			suggestions.style.display = 'none';
	    }
	});
	//清除全部事件
	sweep_btn.addEventListener('click',()=>{
		event_flow=[];
		tbody.innerHTML='';
	});
	//点击储存到本地
	store_btn.addEventListener('click',()=>{
		if(event_flow.length>0){
			window.api.save(event_flow);
		}else{
			console.log('no data there');
		}
	});
	//-------------------------------事件流区----------------------------------
	fileInput.addEventListener('change',()=>{
		if (fileInput.files.length > 0) {
		        const file = fileInput.files[0];
		        if (file.type === 'application/json') {
		          startflow_btn.disabled = false;
				  edit_btn.disabled=false;
				  jsonpath=fileInput.files[0].path;
		        } else {
		          startflow_btn.disabled = true;
				  edit_btn.disabled=true;
		        }
		      } else {
		        startflow_btn.disabled = true;
				edit_btn.disabled=true;
		      }
	});
	startflow_btn.addEventListener('click',()=>{
		fetch(jsonpath)
		.then(response=>response.json())
		.then(data=>{
			document.getElementById('console_platform').textContent+='开始执行...\n';
			window.api.match(data);
		})
		.catch(error=>{
			console.error('error:',error);
		});
	});
	edit_btn.addEventListener('click',()=>{
		tflow_btn.classList.add('active-btn');
		wflow_btn.classList.remove('active-btn');
		setting_btn.classList.remove('active-btn');
		tflow_div.style.display='block';
		wflow_div.style.display='none';
		setting_div.style.display='none';
		tsetting.style.display='block';
		fetch(jsonpath)
		.then(response=>response.json())
		.then(data=>{
			 event_flow=data;
			 tbody.innerHTML='';
			 event_flow.forEach((obj,index)=>{
				 if(obj.eventtype=='match_start'){
					 addData(1,false,index,obj);
				 }else if(obj.eventtype=='scoll_start'){
					 addData(2,false,index,obj);
				 }else if(obj.eventtype=='type_start'){
					 addData(3,false,index,obj);
				 }else if(obj.eventtype=='wait'){
					 addData(4,false,index,obj);
				 }
				 
			 });
			 //console.log(event_flow);
		})
		.catch(error=>{
			console.error('error:',error);
		});
	});
	//-------------------------------设置区------------------------------------
	const clean_btn=document.getElementById('clean_btn');
	clean_btn.addEventListener('click',()=>{
		window.api.clean();
	});
	const about_btn=document.getElementById('about_btn');
	const about_label=document.getElementById('about_label');
	about_btn.addEventListener('click',()=>{
		about_label.textContent='应用名称:PuppetMaster   版本号:1.0.0    作者:scriptLin   简介:PuppetMaster是一款能够模拟键盘鼠标的脚本自定义工具,具有上手门槛低,无代码能力要求,匹配精准度高等优点,该应用为个人独立开发，仅供学习参考,如需商用或赞助请访问本项目github地址:https://github.com/scriptLin-bjtu/PuppetMaster';
		about_label.style.display='block';
		about_label.style.color='green';
	});
	
	function addData(eventid,ifpush=true,index=0,obj=null){
		const newRow = document.createElement('tr');
		const cell1 = document.createElement('td');
		const cell2 = document.createElement('td');
		const cell3 = document.createElement('td');
		const deletspan=document.createElement('span');
		if(ifpush){
			newRow.dataset.index=event_flow.length;
		}else{
			newRow.dataset.index=index;
		}
		deletspan.classList.add('delete_span');
		deletspan.textContent='删除';
		deletspan.addEventListener('click',()=>{
			// 获取所点击的行
			const row = deletspan.parentElement.parentElement;
			//删除数组对应索引的值
			event_flow.splice(row.rowIndex-1,1);
			 // 从表格中移除该行
			row.remove();
		});
		cell3.appendChild(deletspan);
		if(eventid==1){//鼠标点击
			if(obj==null){
				const eventdata={
					path:imgpath,
					match_interval:miInput.value,
					click_interval:ciInput.value,
					click_times:ctInput.value,
					right_mouse:rcCheck.checked,
					click_toggle:toggleCheck.checked,
					toggle_time:toggleInput.value,
					targetx:tx,
					targety:ty
				}
				const obj={
					eventtype:'match_start',
					data:eventdata
				}
				cell1.textContent = '鼠标点击';
				const img=document.createElement('img');
				let t=`点击:${eventdata.click_times}次,是否长按:${eventdata.click_toggle},是否右键:${eventdata.right_mouse}`;
				const textnode=document.createTextNode(t);
				img.classList.add('showimg');
				img.src=eventdata.path;
				cell2.appendChild(img);
				cell2.appendChild(textnode);
				event_flow.push(obj);
				
			}else{
				cell1.textContent = '鼠标点击';
				const img=document.createElement('img');
				let t=`点击:${obj.data.click_times}次,是否长按:${obj.data.click_toggle},是否右键:${obj.data.right_mouse}`;
				const textnode=document.createTextNode(t);
				img.classList.add('showimg');
				img.src=obj.data.path;
				cell2.appendChild(img);
				cell2.appendChild(textnode);
			}
			
		}else if(eventid==2){//鼠标滚轮
			if(obj==null){
				const eventdata={
					up:upscoll.checked,
					down:downscoll.checked,
					unit:scollinput.value
				}
				const obj={
					eventtype:'scoll_start',
					data:eventdata
				}
				cell1.textContent = '鼠标滚轮';
				cell2.textContent =(eventdata.up?`向上滚动${eventdata.unit}单位`:(eventdata.down?`向下滚动${eventdata.unit}单位`:'错误'));
				event_flow.push(obj);
				
			}else{
				cell1.textContent = '鼠标滚轮';
				cell2.textContent =(obj.data.up?`向上滚动${obj.data.unit}单位`:(obj.data.down?`向下滚动${obj.data.unit}单位`:'错误'));
			}
			
		}else if(eventid==3){//键盘按键
			if(obj==null){
				let karr=keyinput.value.split('+');
				const eventdata={
					typetimes:keytimes.value,
					typeinterval:keyinterval.value,
					keys:karr,
					keytoggle:togglekeycheck.checked,
					keytoggletime:togglekeyinput.value,
					stringcheck:stringcheck.checked,
					stringinput:stringinput.value
				}
				const obj={
					eventtype:'type_start',
					data:eventdata
				}
				cell1.textContent = '键盘按键';
				cell2.textContent = (eventdata.stringcheck?`输入文段:[${eventdata.stringinput}]`:(eventdata.keytoggle?`长按[${eventdata.keys}]${eventdata.keytoggletime}毫秒`:`按键:[${eventdata.keys}]${eventdata.typetimes}次`));
				event_flow.push(obj);
			}else{
				cell1.textContent = '键盘按键';
				cell2.textContent = (obj.data.stringcheck?`输入文段:[${obj.data.stringinput}]`:(obj.data.keytoggle?`长按[${obj.data.keys}]${eventdata.keytoggletime}毫秒`:`按键:[${obj.data.keys}]${obj.data.typetimes}次`));
			}
			
		}else if(eventid==4){//等待
			if(obj==null){
				const eventdata={
					waittime:breaktime.value
				}
				const obj={
					eventtype:'wait',
					data:eventdata
				}
				cell1.textContent = '等待';
				cell2.textContent = eventdata.waittime+'毫秒';
				event_flow.push(obj);
			}else{
				cell1.textContent = '等待';
				cell2.textContent = obj.data.waittime+'毫秒';
			}
		}
		newRow.draggable=true;
		newRow.appendChild(cell1);
		newRow.appendChild(cell2);
		newRow.appendChild(cell3);
		tbody.appendChild(newRow);
	}
});



