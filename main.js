const {
	app,
	BrowserWindow,
	ipcMain,
	desktopCapturer,
	dialog,
	clipboard
} = require('electron');
const path = require('node:path');
const robot = require('robotjsfix');
const { cv, CV_8UC4 } = require('@u4/opencv4nodejs');
const { resolve } = require('node:dns/promises');
const { rejects } = require('node:assert');
const fs = require('fs');
const { execFile } = require('child_process');
const { error } = require('node:console');
let win;//主窗口
function createWindow() {
	win = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar:true,
		webPreferences: {
			nodeIntegration: true,
			preload: path.join(__dirname, 'preload.js')
		}
	});

	win.loadFile('index.html');
	ipcMain.on('match_start', async(event, arg) => {
		console.log('----matching----');
		
		try{
			const suc=await start_match(arg.path,arg.match_interval,arg.click_times,arg.click_interval,arg.right_mouse,arg.click_toggle,arg.toggle_time,arg.targetx,arg.targety);
			if(suc){
				let alltime=(arg.click_times*arg.click_interval)/1000;
				console.log('----match-successfully----');
				win.webContents.send('suc_match',`图片${arg.path}匹配成功，共点击${arg.click_times}次，耗时${alltime}秒\n`);
			}else{
				console.log('----match-unsuccessfully----');
				win.webContents.send('fal_match',`错误:图片${arg.path}匹配失败\n`);
			}
		}catch (error) {
            console.error('----error in matching----', error);
			win.webContents.send('fal_match','错误:没有选择图片\n');
        }
		
	});
	ipcMain.on('scoll_start', async(event, arg) => {
		console.log('----scolling----');
		try{
			const suc=await start_scoll(arg.up,arg.down,arg.unit);
			if(suc){
				console.log('----scoll-successfully----');
				win.webContents.send('suc_scoll','鼠标滚动成功\n');
			}
		}catch(error){
			console.error('----error in scolling----',error);
		}
		
	});
	ipcMain.on('type_start',async(event,arg)=>{
		console.log('----typing----');
		try{
			const suc=await start_type(arg.typetimes,arg.typeinterval,arg.keys,arg.keytoggle,arg.keytoggletime,arg.stringcheck,arg.stringinput);
			if(suc){
				console.log('----type-successfully----');
				win.webContents.send('suc_type','按键操作成功\n');
			}
		}catch(error){
			console.error('----error in typing----',error);
			win.webContents.send('fal_type','按键操作失败\n');
		}
	});
	ipcMain.on('wait',async(event,arg)=>{
		console.log('----waiting----');
		try{
			const suc=await start_wait(arg.waittime);
			if(suc){
				console.log('----wait-successfully----');
				win.webContents.send('suc_wait',`等待成功，耗时${arg.waittime}毫秒\n`);
			}
		}catch(error){
			console.error('----error in waiting----',error);
		}
	});
	ipcMain.on('help', () => {
		dialog.showMessageBox({
					type: 'info',
			        title: '按键帮助',
			        message: '对于数字和字母按键您可以直接输入如： a, 1 \n对于功能键请您输入对应的拼写如：shift，control，delete\n如果您希望使用组合键，请在中间添加+号如：control+s\n注意：请确保拼写正确，需要使用小写，不可缩写\n长按和长文本输入只能勾选一个，长按只允许单个按键',
			        buttons: ['确定'],
			        defaultId: 0,
			        cancelId: 1
		});
	});
	ipcMain.on('screenshot',async()=>{
		try {
		    let path1 = await takeScreenshot(); // 等待截图完成并获取路径
		    //console.log(path1);
		    win.webContents.send('cut_suc', path1);
		    } catch (error) {
		    console.error('Error taking screenshot:', error);
		}
	});
	ipcMain.on('openChildWindow',(event,arg)=>{
		//打开描点窗口
		let childWindow = new BrowserWindow({
		    width: 400,
		    height: 400,
			autoHideMenuBar:true,
		    parent: win,
		    modal: true,
		    show: false,
		    webPreferences: {
		      nodeIntegration: true,
			  preload: path.join(__dirname, 'preload.js')
			}
		});
		childWindow.loadFile('child.html');
		childWindow.once('ready-to-show', () => {
		    childWindow.show();
			//console.log(arg);
		    childWindow.webContents.send('imageURL', arg);
		});
		// 监听子窗口发送的点击事件和坐标
		ipcMain.removeAllListeners('click');
		ipcMain.on('click', (e, x, y) => {
		// 将点击坐标发送给主窗口
			win.webContents.send('clickedPoint', { x, y });
		// 关闭子窗口
			childWindow.close();
		});
	});
	ipcMain.on('clean',async()=>{
		cleanup().then(() => {
		    console.log('Cleanup completed.');
		}).catch(error => {
		    console.error('Cleanup failed:', error);
		});
	});
	ipcMain.on('save',(event,arg)=>{
		showDialog(arg);
	});
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
//鼠标操作
function start_match(temple_img,match_interval=1000,click_times=1,click_interval=1000,rightclick=false,toggle=false,toggle_time=2000,targetx=0.5,targety=0.5){
	return new Promise((resolve,reject)=>{
		const templateImage = cv.imread(temple_img);
		let counter = 0;//计数器当超过5次检测还没有匹配成功就reject
		let click_counter=0;
		let moniter=setInterval(()=>{
			counter++;
			// 设置截屏区域
			const screenBounds = robot.getScreenSize();
			const captureWidth = screenBounds.width;
			const captureHeight = screenBounds.height;
			// 截屏
			let bitmap = robot.screen.capture(0, 0, captureWidth, captureHeight);
			// 创建opencv的Mat对象
			let mat = new cv.Mat(bitmap.image, bitmap.height, bitmap.width, cv.CV_8UC4).cvtColor(cv.COLOR_RGBA2RGB);
			let match_result=mat.matchTemplate(templateImage, cv.TM_CCOEFF_NORMED);
			
			if(match_result.minMaxLoc().maxVal>=0.7){
				robot.moveMouse(match_result.minMaxLoc().maxLoc.x+templateImage.cols*targetx,match_result.minMaxLoc().maxLoc.y+templateImage.rows*targety);
				if(click_times!==1){
					let click_timer=setInterval(()=>{
						if(toggle){
							if(rightclick){
								robot.mouseToggle('down','right');
								setTimeout(()=>{
									robot.mouseToggle('up','right');
								},toggle_time);
							}else{
								robot.mouseToggle('down');
								setTimeout(()=>{
									robot.mouseToggle('up');
								},toggle_time);
							}
						}else{
							if(rightclick){
								robot.mouseClick('right')
							}else{
								robot.mouseClick();
							}
						}
						click_counter++;
						if(click_counter==click_times){
							clearInterval(click_timer);
						}
					},click_interval);
				}else{
					robot.mouseClick();
				}
				mat.release();
				clearInterval(moniter);
				resolve(true);
			}
			mat.release();
			if (counter >= 5) {
			    clearInterval(moniter);
			    resolve(false);
			}
		},match_interval);
	});
	
}
//滚轮操作
function start_scoll(up=true,down=false,unit=1){
	return new Promise((resolve,reject)=>{
		if(up){
			robot.scrollMouse(0,unit);
			resolve(true);
		}
		else if(down){
			robot.scrollMouse(0,-unit);
			resolve(true);
		}else {
            reject(new Error('Neither up nor down flag is set.'));
        }
		
	});
	
}
//按键操作
function start_type(typetimes=1,typeinterval=1000,keys=[],iftoggle=false,toggletime=1000,ifstring=false,string='`'){
	return new Promise((resolve,reject)=>{
		if(iftoggle){
			robot.keyToggle(keys[0],"down");
			setTimeout(()=>{
				robot.keyToggle(keys[0],"up");
				resolve(true);
			},toggletime);
		}else if(ifstring){
			setTimeout(()=>{
				robot.typeString(string);
				resolve(true);
			},1000);
		}else{
			keys.forEach((key)=>{
				robot.keyTap(key);
			});
			resolve(true);
		}
	});
}
//等待操作
function start_wait(waittime){
	return new Promise((resolve,reject)=>{
		setTimeout(()=>{
			resolve(true);
		},waittime);
	});
}
//截图操作
function ensureScreenshotFolderExists() {
    //const screenshotFolderPath = path.join(__dirname, 'screen');//开发环境
	const screenshotFolderPath = path.join(process.resourcesPath, 'screen');//生产环境
    if (!fs.existsSync(screenshotFolderPath)) {
        fs.mkdirSync(screenshotFolderPath);
    }
}
function takeScreenshot() {
	return new Promise((resolve,reject)=>{
		ensureScreenshotFolderExists();
		win.minimize();
		clipboard.clear();
		setTimeout(()=>{
			//下面为开发环境
			//let executablePath=path.join(app.getAppPath(), 'tools', 'PrintScr.exe');
			let executablePath=path.join(process.resourcesPath, 'tools', 'PrintScr.exe');
			let screen_window = execFile(executablePath);
			screen_window.on('exit', function (code) {
				if(code){
					let pngs = clipboard.readImage().toPNG();
					let imgData = Buffer.from(pngs, 'base64');
					//下面为开发环境
					//let path1 = __dirname + `/screen/${Date.now()}.png`;
					let path1=process.resourcesPath+`/screen/${Date.now()}.png`;
					try {
					    fs.writeFileSync(path1, imgData);
					    console.log('Image saved successfully');
						win.restore();
					    resolve(path1); // 解决 Promise 并返回路径
					} catch (error) {
					    console.error('Error saving image:', error);
						win.restore();
					    reject(error); // 如果出现错误则拒绝 Promise
					}
				}else{
					win.restore();
					console.log('----cancel-cut----');
				}
			});
		},500);
	});
}
//显示dialog处理逻辑
function showDialog(data) {
        // 配置保存对话框选项
        const options = {
            title: '保存文件',
            defaultPath: '', // 默认保存路径
            buttonLabel: '保存', // 按钮的标签
            filters: [
                { name: 'json文件', extensions: ['json'] }, // 可选择的文件类型
                { name: '所有文件', extensions: ['*'] }
            ]
        };
        // 打开保存对话框
        dialog.showSaveDialog(null, options)
            .then(result => {
                // 如果用户点击了保存按钮并选择了文件路径
                if (!result.canceled && result.filePath) {
                    console.log('savepath:', result.filePath);
                    const jsonData = JSON.stringify(data, null, 2);
                    fs.writeFileSync(result.filePath,jsonData,'utf8');
                } else {
                    console.log('cancel save');
                }
            })
            .catch(err => {
                console.log('error:', err);
            });
}

//清除截图的文件
function cleanup(){
	return new Promise((resolve,reject)=>{
		fs.readdirSync(process.resourcesPath+'/screen/').forEach(file => {
		    const filePath = path.join(process.resourcesPath+'/screen/', file);
		    fs.unlinkSync(filePath);
		}); 
		//下面为开发环境
		/* fs.readdirSync(__dirname+'/screen/').forEach(file => {
        const filePath = path.join(__dirname+'/screen/', file);
        fs.unlinkSync(filePath);
		}); */
	resolve(true);
	});
}