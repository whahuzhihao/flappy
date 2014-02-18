Option = function()
{
	this.gravity = GRAVITY;
	this.flap = FLAP;
	this.xSpeed = XSPEED;
	this.FPS = FPS;	
	
	this.groundMovePx = GROUND_OFFSET*this.xSpeed/this.FPS;
	this.birdChangeStep = BIRD_CHANGE_NUM/this.FPS;
	this.birdAngleDownStep = BIRD_ANGLE_DOWN_STEP/this.FPS;
	this.birdAngleUpStep = BIRD_ANGLE_UP_STEP/this.FPS;

	this.dt = 1/this.FPS;
	this.acceleration = new Vector(0,GRAVITY);
}
Game = function()
{
	this.option = new Option();
	this.status = WELCOME;
	this.score = 0;
	this.birdSprite = BIRD;
	this.bgSprite = BG;
	this.groundSprite = GROUND;
	this.tubeQueue = new TubeQueue();	
}
Game.prototype.start = function start()
{
	var that = this;
	var intervalId = setInterval(function(){that.loop(intervalId);},1000/this.option.FPS)
}

Game.prototype.loop = function(intervalId)
{
	//画背景 不需要clear因为背景直接覆盖了
	this.bgSprite.draw(Context);
	
	//画管子
	this.tubeQueue.draw(Context);
	this.tubeQueue.update(this);
	
	//画地面
	this.groundSprite.draw(Context);
	this.groundSprite.update(this);

	//画小鸟
	this.birdSprite.draw(Context);
    this.birdSprite.update(this);
	
	Context.save();
	Context.fillStyle    = '#fff';
	Context.textBaseline = 'top';
	Context.textAlign = 'center';
	if(this.status == WELCOME)
	{
		if(isIOS && loadStep<5)
		{
			Context.font = 'bold 10px Arial '; 
			Context.fillText ("IOS Device Need Touching 5 Times to Load Music",CANVAS_WIDTH/2,CANVAS_HEIGHT/4+55);
			if(ifLoaded!=3)
			{
				if(ifLoaded == 1)//载入中 请稍等
				{
					Context.fillText ("LOADING "+getLoadStep(loadStep)+" PLEASE WAIT",CANVAS_WIDTH/2,CANVAS_HEIGHT/4+80);
				}else{//载入完了 可以载入新的了
					Context.fillText ("STEP "+(loadStep+1)+" PRESS TO LOAD "+getLoadStep(loadStep),CANVAS_WIDTH/2,CANVAS_HEIGHT/4+80);
				}				
			}else{
				Context.fillText ("COMPLETE!",CANVAS_WIDTH/2,CANVAS_HEIGHT/4+80);			
			}
			
		}
		Context.font = 'bold 25px Arial '; 
		Context.fillText ("HuGao's",CANVAS_WIDTH/2,CANVAS_HEIGHT/4-15);
		Context.strokeText ("HuGao's",CANVAS_WIDTH/2,CANVAS_HEIGHT/4-15);
		Context.fillText ("Flappy Bird",CANVAS_WIDTH/2,CANVAS_HEIGHT/4+15);
		Context.strokeText ("Flappy Bird",CANVAS_WIDTH/2,CANVAS_HEIGHT/4+15);
		Context.font = 'bold 15px Arial '; 
		Context.fillText ("TOUCH TO START",CANVAS_WIDTH/2,2*CANVAS_HEIGHT/3);
		Context.strokeText ("TOUCH TO START",CANVAS_WIDTH/2,2*CANVAS_HEIGHT/3);
		
	}else{
		Context.font = 'bold 30px Arial '; 
		Context.fillText (this.score,CANVAS_WIDTH/2,CANVAS_HEIGHT/6);
		Context.strokeText (this.score,CANVAS_WIDTH/2,CANVAS_HEIGHT/6);
	}
	Context.restore();
	
	if(this.status == END)
	{
		if(ifSupportStorage)
		{
			if(storage.getItem('high_score')==null||storage.getItem('high_score')<=this.score)
			{
				storage.removeItem('high_score');
				storage.setItem('high_score',this.score);
			}
		}else{
			if(getCookie('high_score')=="" || getCookie("high_score")<=this.score)
			//不支持 localstorage 我拿cookie给你存一年
			setCookie('high_score',this.score,365);
		}

		Context.save();
		Context.fillStyle    = '#fff';
		Context.textBaseline = 'top';
		Context.textAlign = 'center';
		
		Context.font = 'bold 25px Arial ';
		Context.fillText ("GAME OVER",CANVAS_WIDTH/2,CANVAS_HEIGHT/3);
		Context.strokeText ("GAME OVER",CANVAS_WIDTH/2,CANVAS_HEIGHT/3);
		Context.fillText ("HIGH SCORE",CANVAS_WIDTH/2,CANVAS_HEIGHT/2);
		Context.strokeText ("HIGH SCORE",CANVAS_WIDTH/2,CANVAS_HEIGHT/2);			
		Context.fillText (ifSupportStorage?storage.getItem('high_score'):getCookie('high_score'),CANVAS_WIDTH/2,CANVAS_HEIGHT/2+30);
		Context.strokeText (ifSupportStorage?storage.getItem('high_score'):getCookie('high_score'),CANVAS_WIDTH/2,CANVAS_HEIGHT/2+30);			
		Context.font = 'bold 15px Arial '; 
		Context.fillText ("TOUCH TO TRY AGAIN",CANVAS_WIDTH/2,2*CANVAS_HEIGHT/3);
		Context.strokeText ("TOUCH TO TRY AGAIN",CANVAS_WIDTH/2,2*CANVAS_HEIGHT/3);
		Context.restore();
		
		clearInterval(intervalId);
		return;
	}
	
	if(this.status == PLAYING)
	{
		if(this.birdSprite.ifHit(this.tubeQueue.tubes))
		{
			this.status = DYING;
			Sound.playDie();
			Sound.playHit();			
		}
	}	
}

function getLoadStep(step)
{
	switch(step)
	{
		case 0: return "FLAP AUDIO";
		case 1: return "HIT AUDIO";
		case 2: return "POINT AUDIO";
		case 3: return "DIE AUDIO";
		case 4: return "SWOOSH AUDIO";
		default:
		return "COMPLETE";
	}
}