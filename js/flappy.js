/**
 * 一些预设的常量
 */
//帧数
FPS = 60;

//PI
PI = Math.PI;

//长度量
CANVAS_WIDTH = 288;
CANVAS_HEIGHT = 384;
BIRD_WIDTH = 36;
BIRD_HEIGHT = 26;
TUBE_WIDTH = 52;
TUBE_HEIGHT = 320;
SCORE_OFFSET = 2;


//位置量
BG_Y = -70;
GROUND_Y = 320;
BIRD_X = 50;
BIRD_POSITION = (CANVAS_HEIGHT-BIRD_HEIGHT)/2;
GROUND_OFFSET = 48;
BIRD_OFFSET_LIMIT = 10;
TUBE_DISTX = 150;
TUBE_DISTY = 100;
TUBE_HIGH = -280;
TUBE_LOW = -140;
TUBE_DELAY = 80;
BIRD_CENTER_X = BIRD_X+BIRD_WIDTH/2;
BIRD_MIN_X = BIRD_CENTER_X-Math.sqrt(BIRD_WIDTH*BIRD_WIDTH/4+BIRD_HEIGHT*BIRD_HEIGHT/4);
BIRD_MAX_X = BIRD_CENTER_X+Math.sqrt(BIRD_WIDTH*BIRD_WIDTH/4+BIRD_HEIGHT*BIRD_HEIGHT/4);

//其他参数
BIRD_CHANGE_NUM = 10;

//速度 加速度 角度量
BIRD_UP_SPEED = 100;
GRAVITY = 1000;
FLAP = 320;
XSPEED = 4;
BIRD_ANGLE_DOWN_STEP = PI;
BIRD_ANGLE_UP_STEP = -16*PI;
BIRD_UP_SPEED = 30;
BIRD_MAX_UP_ANGLE = -PI/6;
BIRD_MAX_DOWN_ANGLE = PI/2;


//游戏状态
WELCOME = 0;
PLAYING = 1;
DYING = 2;
END = 3;

(function(){
 var lastTime = 0;
 var prefixes = 'webkit moz ms o'.split(' '); //各浏览器前缀

 var requestAnimationFrame = window.requestAnimationFrame;
 var cancelAnimationFrame = window.cancelAnimationFrame;

 var prefix;
 //通过遍历各浏览器前缀，来得到requestAnimationFrame和cancelAnimationFrame在当前浏览器的实现形式
 for( var i = 0; i < prefixes.length; i++ ) {
 if ( requestAnimationFrame && cancelAnimationFrame ) {
 break;
 }
 prefix = prefixes[i];
 requestAnimationFrame = requestAnimationFrame || window[ prefix + 'RequestAnimationFrame' ];
 cancelAnimationFrame  = cancelAnimationFrame  || window[ prefix + 'CancelAnimationFrame' ] || window[ prefix + 'CancelRequestAnimationFrame' ];
 }

 //如果当前浏览器不支持requestAnimationFrame和cancelAnimationFrame，则会退到setTimeout
 if ( !requestAnimationFrame || !cancelAnimationFrame ) {
 requestAnimationFrame = function( callback, element ) {
     var currTime = new Date().getTime();
     //为了使setTimteout的尽可能的接近每秒60帧的效果
     var timeToCall = Math.max( 0, 16.7 - ( currTime - lastTime ) );
     var id = window.setTimeout( function() {
             callback( currTime + timeToCall );
             }, timeToCall );
     lastTime = currTime + timeToCall;
     return id;
 };

 cancelAnimationFrame = function( id ) {
     window.clearTimeout( id );
 };
 }

 //得到兼容各浏览器的API
 window.requestAnimationFrame = requestAnimationFrame;
 window.cancelAnimationFrame = cancelAnimationFrame;
})();


function getCookie(key){
    if (document.cookie.length>0){
        var start=document.cookie.indexOf(key + "=");
        if (start!=-1){ 
            start=start + key.length+1;
            var end=document.cookie.indexOf(";",start);
            if (end==-1) end=document.cookie.length;
            return unescape(document.cookie.substring(start,end));
        } 
    }
    return "";
}
function setCookie(key, value, expiredays){
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + expiredays);
    document.cookie=key+ "=" + escape(value) + ((expiredays==null) ? "" : ";expires="+exdate.toGMTString());
}



/**
 * vector向量类
 */
Vector = function(x,y)
{
    this.x=x;
    this.y=y;
};
Vector.prototype = 
{
add : function(v) { this.x = this.x+v.x; this.y = this.y+v.y; },
      subtract : function(v) { this.x = this.x - v.x; this.y = this.y - v.y; },
      multiply : function(f) { return new Vector(this.x * f, this.y * f); }
};
Vector.zero = new Vector(0, 0);

/**
 * sprite精灵类 继承vector
 */
Sprite = function(img,sx,sy,sw,sh,ifCut,x,y,angle)
{
    Vector.call(this,x,y);
    this.img = img;
    this.sx = sx;
    this.sy = sy;
    this.width = sw;
    this.height = sh;
    this.ifCut = ifCut;
    this.angle = angle;
    this.halfWidth = this.width/2;
    this.halfHeight = this.height/2;
};
Sprite.prototype = new Vector();
Sprite.prototype.constructor = Sprite;
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
};

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
};

/**
 * ground地面 继承sprite
 */
Ground =function(img,sx,sy,sw,sh,ifCut,x,y,angle)
{
    Sprite.call(this,img,sx,sy,sw,sh,ifCut,x,y,angle);
};
Ground.prototype = new Sprite();
Ground.prototype.constructor = Ground;
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
};
/**
 * tube管道 继承sprite
 */
Tube =function(img,sx,sy,sw,sh,ifCut,x,y,angle)
{
    Sprite.call(this,img,sx,sy,sw,sh,ifCut,x,y,angle);
};
Tube.prototype = new Sprite();
Tube.prototype.constructor = Tube;
Tube.prototype.update = function(game)
{
    if(game.status==WELCOME || game.status==PLAYING)
    {
        this.x -= game.option.groundMovePx;
    }
};
Tube.prototype.randY =function()
{
    this.y = TUBE_LOW-(TUBE_LOW-TUBE_HIGH)*Math.random();
};
/**
 * bird小鸟 继承sprite 
 */
Bird =function(img,sx,sy,sw,sh,ifCut,x,y,angle)
{
    Sprite.call(this,img,sx,sy,sw,sh,ifCut,x,y,angle);
    this.birdIndex = 0;
    this.birdChangeDirection = 1;
    this.velocity = new Vector(0,-BIRD_UP_SPEED);
};
Bird.prototype = new Sprite();
Bird.prototype.constructor = Bird;
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

};
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
};
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
};
/**
 * tubequeue水管队列 封装一些tube的操作
 */
TubeQueue = function()
{
    this.tubes = new Array();
    this.noTubeDist = 0;//已经多长距离没出现管子了
    this.tubesX = new Array();
};
TubeQueue.prototype.draw = function(context)
{
    for(var i=0;i<this.tubes.length;i++)
    {       
        this.tubes[i].draw(context);        
    }
};
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
};
TubeQueue.prototype.addTube =function()
{
    var tube1 = new Tube(TubeImg1,0,0,TUBE_WIDTH,TUBE_HEIGHT,false,CANVAS_WIDTH+TUBE_DELAY,0,0);;
    tube1.randY();
    var tube2 = new Tube(TubeImg2,0,0,TUBE_WIDTH,TUBE_HEIGHT,false,CANVAS_WIDTH+TUBE_DELAY,0,0);
    tube2.y = tube1.y + TUBE_HEIGHT + TUBE_DISTY;
    this.tubes.push(tube1);
    this.tubes.push(tube2);
    this.tubesX.push(tube1.x);
};

/**
 * 苹果移动设备用audio放音频有问题，这里使用webaudio来兼容一下,另外PC浏览器也支持webaudio 安卓内置的浏览器什么都不支持
 */
function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var loader = this;

    request.onload = function() {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
                request.response,
                function(buffer) {
                if (!buffer) {
                alert('error decoding file data: ' + url);
                return;
                }
                loader.bufferList[index] = buffer;
                if (++loader.loadCount == loader.urlList.length)
                loader.onload(loader.bufferList);
                },
                function(error) {
                console.error('decodeAudioData error', error);
                }
                );
    }

    request.onerror = function() {
        alert('BufferLoader: XHR error');
    }

    request.send();
};

BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i)
        this.loadBuffer(this.urlList[i], i);
};


/**
 * 游戏主逻辑
 */
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
};
Game = function()
{
    this.option = new Option();
    this.status = WELCOME;
    this.score = 0;
    this.birdSprite = BIRD;
    this.bgSprite = BG;
    this.groundSprite = GROUND;
    this.tubeQueue = new TubeQueue();   
};
Game.prototype.start = function start()
{
    this.intervalId = window.requestAnimationFrame(this.loop.bind(this));
    //var intervalId = setInterval(function(){that.loop(intervalId);},1000/this.option.FPS)
};
Game.prototype.loop = function()
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
                try {
                    storage.removeItem('high_score');
                    storage.setItem('high_score',this.score);
                } catch (e) {
                    alert("您处于无痕浏览，无法为您保存分数。");
                }
            }           
        }else{
            if(getCookie('high_score')=="" || getCookie("high_score")<=this.score)
                //不支持 localstorage 我拿cookie给你存一年
            {
                setCookie('high_score',this.score,365);
            }
        }
        shareTitle = "我在hugao的山寨flappy bird中得了"+this.score+"分，快来挑战我吧！";

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

        //clearInterval(intervalId);
        window.cancelAnimationFrame(this.intervalId);
        return;
    }

    if(this.status == PLAYING) {
        if (this.birdSprite.ifHit(this.tubeQueue.tubes)) {
            this.status = DYING;
            Sound.playDie();
            Sound.playHit();
        }
    }
    window.requestAnimationFrame(arguments.callee.bind(this));
};

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

