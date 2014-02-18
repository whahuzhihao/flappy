Sprite = function(img,sx,sy,sw,sh,ifCut,x,y,angle)
{
	this.img = img;
	this.sx = sx;
	this.sy = sy;
	this.width = sw;
	this.height = sh;
	this.ifCut = ifCut;
	this.x = x;
	this.y = y;
	this.angle = angle;
	this.halfWidth = this.width/2;
	this.halfHeight = this.height/2;
	Vector.call(this,x,y);
}
Sprite.prototype = new Vector();
Sprite.prototype.draw = function(context)
{
	context.save();
	//不需要旋转的对象
	if(this.angle == 0)
	{
		if(this.ifCut)
		{
			//其实最后两个参数代表画出来图的大小 用于缩放 我们不需要缩放 所以直接用截取的大小
			context.drawImage(this.img,this.sx,this.sy,this.width,this.height,this.x,this.y,this.width,this.height);
		}else{
			//不需要截取 直接画
			context.drawImage(this.img,this.x,this.y);
		}		
	}else{
		//需要旋转
		context.translate(this.x + this.halfWidth, this.y + this.halfHeight);
		//context.globalAlpha = this.alpha;//不需要修改透明度
		context.rotate(this.angle);//旋转角度
		//context.scale(this.scaleX, this.scaleY);//不需要缩放
                if(this.ifCut)
		{
			//其实最后两个参数代表画出来图的大小 用于缩放 我们不需要缩放 所以直接用截取的大小
			context.drawImage(this.img,this.sx,this.sy,this.width,this.height,-this.halfWidth,-this.halfHeight,this.width,this.height);
		}else{
			//不需要截取 直接画
			context.drawImage(this.img,-this.halfWidth,-this.halfHeight);
		}
	}
	context.restore();
}

Sprite.prototype.drawWithAngle = function(context,angle,centerx,centery)
{
	context.save();
	//不需要旋转的对象
	if(angle == 0)
	{
		if(this.ifCut)
		{
			//其实最后两个参数代表画出来图的大小 用于缩放 我们不需要缩放 所以直接用截取的大小
			context.drawImage(this.img,this.sx,this.sy,this.width,this.height,this.x,this.y,this.width,this.height);
		}else{
			//不需要截取 直接画
			context.drawImage(this.img,this.x,this.y);
		}		
	}else{
		//需要旋转
		context.translate(centerx, centery);
		//context.globalAlpha = this.alpha;//不需要修改透明度
		context.rotate(angle);//旋转角度
		//context.scale(this.scaleX, this.scaleY);//不需要缩放
        if(this.ifCut)
		{
			//其实最后两个参数代表画出来图的大小 用于缩放 我们不需要缩放 所以直接用截取的大小
			context.drawImage(this.img,this.sx,this.sy,this.width,this.height,this.x-centerx,this.y-centery,this.width,this.height);
		}else{
			//不需要截取 直接画
			context.drawImage(this.img,this.x-centerx,this.y-centery);
		}
	}
	context.restore();
}

Ground =function(img,sx,sy,sw,sh,ifCut,x,y,angle)
{
	Sprite.call(this,img,sx,sy,sw,sh,ifCut,x,y,angle);
}
Ground.prototype = new Sprite();
Ground.prototype.update = function(game)
{
	if(game.status==WELCOME || game.status==PLAYING)
	{
		this.x -= game.option.groundMovePx;
		if(this.x<-GROUND_OFFSET)
		{
			this.x = 0;
		}
	}	
}

Tube =function(img,sx,sy,sw,sh,ifCut,x,y,angle)
{
	Sprite.call(this,img,sx,sy,sw,sh,ifCut,x,y,angle);
}
Tube.prototype = new Sprite();
Tube.prototype.update = function(game)
{
	if(game.status==WELCOME || game.status==PLAYING)
	{
		this.x -= game.option.groundMovePx;
	}
}
Tube.prototype.randY =function()
{
	this.y = TUBE_LOW-(TUBE_LOW-TUBE_HIGH)*Math.random();
}

Bird =function(img,sx,sy,sw,sh,ifCut,x,y,angle)
{
	Sprite.call(this,img,sx,sy,sw,sh,ifCut,x,y,angle);
	this.birdIndex = 0;
	this.birdChangeDirection = 1;
	this.velocity = new Vector(0,-BIRD_UP_SPEED);
}
Bird.prototype = new Sprite();
Bird.prototype.update = function(game)
{
	this.changeBirdIndex(game);
	if(game.status == PLAYING)
	{
		//向上撞到墙顶 失去速度			
		if(this.y <= 0 && this.velocity.y<0)
		{
			this.velocity.y = 0;
			return;
		}
		if(this.y >= GROUND_Y-BIRD_HEIGHT)
		{		
			Sound.playHit();
			game.status = END;
			return;
		}
		this.add(this.velocity.multiply(game.option.dt));
		this.velocity.add(game.option.acceleration.multiply(game.option.dt));
		//向上飞的时候 头朝上
		if(this.velocity.y<0)
		{
			this.angle += game.option.birdAngleUpStep;
			if(this.angle < BIRD_MAX_UP_ANGLE)
			{
				this.angle = BIRD_MAX_UP_ANGLE;
			}
		}else{
			this.angle += game.option.birdAngleDownStep;
			if(this.angle > BIRD_MAX_DOWN_ANGLE)
			{
				this.angle = BIRD_MAX_DOWN_ANGLE;
			}
		}
		
	}else if(game.status == DYING){
		if(this.velocity.y<0)
		{
			this.velocity.y=0;
		}
		if(this.y >= GROUND_Y-BIRD_HEIGHT)
		{
			game.status = END;
			return;
		}
		this.add(this.velocity.multiply(game.option.dt));
		this.velocity.add(game.option.acceleration.multiply(game.option.dt));
		if(this.velocity.y<0)
		{
			this.angle += game.option.birdAngleUpStep;
			if(this.angle < BIRD_MAX_UP_ANGLE)
			{
				this.angle = BIRD_MAX_UP_ANGLE;
			}
		}else{
			this.angle += game.option.birdAngleDownStep;
			if(this.angle > BIRD_MAX_DOWN_ANGLE)
			{
				this.angle = BIRD_MAX_DOWN_ANGLE;
			}
		}

	}else if(game.status == WELCOME){
		this.add(this.velocity.multiply(game.option.dt));
		if(this.y >BIRD_POSITION+BIRD_OFFSET_LIMIT || this.y < BIRD_POSITION-BIRD_OFFSET_LIMIT)
		{
			this.velocity.y = -this.velocity.y;
		}
	}
	
}
Bird.prototype.changeBirdIndex = function(game)
{
	this.birdIndex += game.option.birdChangeStep;//1秒钟换10次
    if(this.birdIndex>1)
    {
        this.sx += BIRD_WIDTH*this.birdChangeDirection;
        if(this.sx == 0 || this.sx == 2*BIRD_WIDTH)
        {
            this.birdChangeDirection = -this.birdChangeDirection;            
        }
        this.birdIndex = 0;
    }
}
Bird.prototype.ifHit = function(spriteArr)
{
	if(spriteArr.length<2)
	return false;
    var canvas = document.createElement('canvas');
    canvas.setAttribute('width', CANVAS_WIDTH);
    canvas.setAttribute('height', CANVAS_HEIGHT);
    var context = canvas.getContext('2d');
	
    //this.draw(context);
	//用这种不带角度的draw把鸟平铺
	this.drawWithAngle(context,0,0,0);
	//原来的方法其实不准，因为取出来是按照没有旋转来取的 现在改成把鸟平放，水管斜着放
    var data1 = context.getImageData(this.x, this.y, this.width, this.height).data;
	context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for(var i=0;i<spriteArr.length;i++)
    {
		//这里做优化 this.x其实是固定的 加上倾斜以后最大位置的判断 不然会漏掉
		//if(spriteArr[i].x+TUBE_WIDTH<this.x || spriteArr[i].x>this.x+BIRD_WIDTH)
		if(spriteArr[i].x+TUBE_WIDTH<BIRD_MIN_X || spriteArr[i].x>BIRD_MAX_X)
		continue;
		//把水管绕小鸟的中心反过来转。。等于小鸟转了
        spriteArr[i].drawWithAngle(context,-this.angle,BIRD_CENTER_X,this.y-BIRD_WIDTH/2);
    }   
    var data2 = context.getImageData(this.x, this.y, this.width, this.height).data;	
    for(var i = 3; i < data1.length; i += 4)
    {
        if(data1[i] > 0 && data2[i] > 0) 
		return true;
    }
    return false;
}
TubeQueue = function()
{
	this.tubes = new Array();
	this.noTubeDist = 0;//已经多长距离没出现管子了
	this.tubesX = new Array();
}
TubeQueue.prototype.draw = function(context)
{
	for(var i=0;i<this.tubes.length;i++)
	{		
		this.tubes[i].draw(context);		
	}
}
TubeQueue.prototype.update = function(game)
{
	if(game.status == WELCOME || game.status == END || game.status == DYING)
	{
		return;
	}
	if(this.noTubeDist > TUBE_DISTX + TUBE_WIDTH)
	{
		this.addTube();
		this.noTubeDist = 0;
	}
	if(this.tubes.length>1)
	{
		//去掉已经越过边界的水管
		if(this.tubes[0].x<-TUBE_WIDTH)
		{
			this.tubes.shift();
			this.tubes.shift();
		}
		//把剩下的每个水管画一遍
		for(var i=0;i<this.tubes.length;i++)
		{		
			this.tubes[i].update(game);
		}
	}
	if(this.tubesX.length>0)
	{
		if(this.tubesX[0] < BIRD_X+BIRD_WIDTH-SCORE_OFFSET)
		{			
			Sound.playPoint();
			game.score++;
			this.tubesX.shift();
		}
		for(var i=0;i<this.tubesX.length;i++)
		{		
			this.tubesX[i]-=game.option.groundMovePx;			
		}
	}
	this.noTubeDist+=game.option.groundMovePx;
}
TubeQueue.prototype.addTube =function()
{
	var tube1 = new Tube(TubeImg1,0,0,TUBE_WIDTH,TUBE_HEIGHT,false,CANVAS_WIDTH+TUBE_DELAY,0,0);;
	tube1.randY();
	var tube2 = new Tube(TubeImg2,0,0,TUBE_WIDTH,TUBE_HEIGHT,false,CANVAS_WIDTH+TUBE_DELAY,0,0);
	tube2.y = tube1.y + TUBE_HEIGHT + TUBE_DISTY;
	this.tubes.push(tube1);
	this.tubes.push(tube2);
	this.tubesX.push(tube1.x);
}

