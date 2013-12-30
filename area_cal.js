/**
	* 计算刮开的面积
	* @param opts
	* @param 
	*/
	var PathArea = function(opts){
		opts = opts || {};
		this.width = opts.width;
		this.height = opts.height;
		this.areaRadius = opts.areaRadius || 0;
		this.shareList = {
			"circle":function(){}
		};
		this.drawShape = this.shareList[opts.drawShape||"circle"];
		
		this.passedCount = 0;
		this.totalCount = 0;
		
		this.matrixAry = [];
		
		this.init();
	};

	PathArea.prototype = {
		constructor:PathArea,
		init:function(width,height){
			width = this.parseNum(width);
			height = this.parseNum(height);
			
			this.width = width;
			this.height = height;
			
			this.totalCount = width * height;
			this.updateMatrix(width,height);
		},
		parseNum:function(num){
			num = parseFloat(num,10);
			num = isNaN(num)?0:num;
			return num;
		},
		calculateArea:function(center,r){
			//计算矩形内所有的点
			if(!this.isPoint(center)){
				return;
			}
			r = r || this.areaRadius;
			var beginX = center.x - Math.round(r);
			var endX = center.x + Math.round(r);
			
			var beginY = center.y - Math.round(r);
			var endY = center.y + Math.round(r);
			
			for(var i = beginX; i < endX; i++){
				for(var j= beginY; j< endY;j++){
					if(this.matrixAry[j] !== undefined){
						if(this.matrixAry[j][i] == 0){
							
						}else if(this.matrixAry[j][i] == 1){
							this.passedCount = this.passedCount + 1;
							this.matrixAry[j][i] = 0;
						}
					}
					//this.matrixAry[j][i] = 0;
				}
			}
			
		},
		updatePercent:function(p1,p2){
			var ls = this.getPath(p1,p2);
			for(var i=0,len = ls.length; i < len; i++){
				var p = ls[i];
				this.calculateArea(p);
			}
		},
		getDrawedPercent:function(){
			return (this.passedCount/this.totalCount)*100 + "%";
		},
		isNum:function(obj){
			return Object.prototype.toString.call(obj) === "[object Number]";
		},
		isPoint:function(p){
			if(this.isNum(p.x) && this.isNum(p.y)){
				return true;
			}
			return false;
		},
		isPointEq:function(p1,p2){
			if(!this.isPoint(p1) || !this.isPoint(p2)){
				return false;
			}
			if(p1.x == p2.x && p1.y == p2.y){
				return true;
			}
			return false;
		},
		getPath : function(p1,p2){
			//todo:还可以优化
			var pList = [];
			if(this.isPointEq(p1,p2)){
				pList.push(p1);
				return pList;
			}
			//x1 , x2
			var beginP = 0;
			var endP = 0;
			var tmp = 0;
			if(p1.x < p2.x){
				beginP = p1.x;
				endP = p2.x;
			}else{
				beginP = p2.x;
				endP = p1.x;
			}
			for(tmp = beginP;  tmp <= endP; tmp++){
				pList.push({x:tmp,y:parseInt((tmp-p2.x)*(p1.y-p2.y)/(p1.x-p2.x)+p2.y,10)});
			}
			return pList;
			
		},
		updateMatrix : function(width,height){
			var that = this;
			for(var h=0; h < height; h++){
				that.matrixAry[h] = [];
				for(var w=0; w<width; w++){
					that.matrixAry[h][w] = 1;
				}
			}
			return that.matrixAry;
		},
		cloneMatrix:function(){
			
		}
	};

	/**
	* 为指定的图片生成刮刮卡图层
	* @param imgId img标签ID
	* @param condition 刮开比例 作为触发callback的条件 即 刮开百分之XX之后触发callback 默认为90%
	* @param isOnce callback是否只调用1次 默认为否
	*/
	function createScratchCard(imgId,condition,callback,isOnce){
		var pathArea = new PathArea({
			areaRadius:14.5
		});
		var prep = null;
		var img=document.getElementById(imgId);
		if(img.complete || img.readyState == 'loading' || img.readyState == 'complete'){
			generate();
		}
		else{
			img.onload=generate;
		}

		function generate(){
			var cvs=document.createElement('canvas');
			cvs.style.position='absolute';
			cvs.style.left=img.offsetLeft+'px';
			cvs.style.top=img.offsetTop+'px';
			cvs.width=img.width;
			cvs.height=img.height;
			pathArea.init(cvs.width,cvs.height);
			img.parentNode.insertBefore(cvs,img);
			var context=cvs.getContext('2d');
			context.fillStyle='#bbb';
			context.fillRect(0, 0, context.canvas.width, context.canvas.height);
			context.globalCompositeOperation = 'destination-out';
			context.strokeStyle="fff";
			context.lineJoin = "round";
			context.lineWidth = 35;
			var offsetParent=cvs,offsetLeft=0,offsetTop=0;
			while(offsetParent){
				offsetLeft+=offsetParent.offsetLeft;
				offsetTop+=offsetParent.offsetTop;
				offsetParent=offsetParent.offsetParent;
			}
			var pathPoints=[];
			var x,y;
			var start='mousedown',move='mousemove',end='mouseup';
			if(document.createTouch){
				start="touchstart";
				move="touchmove";
				end="touchend";
			}
			cvs.addEventListener(start,onTouchStart);
			

			function onTouchStart(e){
				e.preventDefault();
				if(e.changedTouches){
					e=e.changedTouches[e.changedTouches.length-1];
				}
				console.log(e.pageX,offsetLeft);
				x=e.pageX - offsetLeft;
				y=e.pageY - offsetTop;
				context.beginPath();
				context.arc(x, y, 35/2, 0, Math.PI*2, true);
				context.closePath();
				context.fill();
				document.addEventListener(end,onTouchEnd);
				cvs.addEventListener(move,onTouch)
				prep = {x:x,y:y};
				pathArea.updatePercent(prep,{x:x,y:y});
				console.log(pathArea.getDrawedPercent());
			}

			function onTouch(e){
				if(e.changedTouches){
					e=e.changedTouches[e.changedTouches.length-1];
				}
				context.beginPath();
				context.moveTo(x, y);
				context.lineTo(e.pageX - offsetLeft, e.pageY- offsetTop);
				x=e.pageX - offsetLeft;y=e.pageY - offsetTop;
				context.closePath();
				context.stroke();
				var n=(Math.random()*10000000)|0;
				context.canvas.style.color='#'+ n.toString(16);//fix android 4.2 bug force repaint
				var t1 = +new Date();
				pathArea.updatePercent(prep,{x:x,y:y});
				console.log(pathArea.getDrawedPercent()+"\t time:"+(new Date() - t1));
				prep = {x:x,y:y};
				
			}

			function onTouchEnd(){
				cvs.removeEventListener(move,onTouch);
				pathPoints=[];
				check();
				prep = null;
			}
			function check(){
				var st=+new Date();
				data=context.getImageData(0,0,cvs.width,cvs.height).data;
				var length=data.length,k=0;
				for(var i=0;i<length-3;i+=4){
					if(data[i]==0&&data[i+1]==0&&data[i+2]==0&&data[i+3]==0){
						k++;
					}
				}
				var f=k*100/(cvs.width*cvs.height);
				if(f>(condition||90)){
									if( callback){
										callback(f,t);
										if(isOnce){
										callback=null;}
									
									}
									
				}
				var t=+new Date()-st;
				console.log('刮开面积:'+f.toFixed(2)+'% 检测耗时'+ t+'ms ');
				data=null;
			}
		}
	}

	createScratchCard('photo',1,function (f,t){
		document.getElementById('lcd').value='刮开面积:'+f.toFixed(2)+'%';

	});