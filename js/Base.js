//帧数
FPS = 30;

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

