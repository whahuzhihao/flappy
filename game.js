/**
 * flappy bird 简单移植版
 * 未使用任何前端框架、游戏引擎框架
 * 静态资源使用base64硬编码到html
 * 使用原生JS，定义精灵类和其衍生精灵，实现垂直重力和横向匀速的简易引擎
 * 实时计算帧之间的间隔，支持不同刷新率的屏幕下达到同样的画面行进速度
 */



/**
 * 一些预设的常量
 */
//帧数 用来计算速度的变化量的，实际帧率是跟着设备走的
const FPS = 60;

//PI
const PI = Math.PI;

//长度量
const CANVAS_WIDTH = 288;
const CANVAS_HEIGHT = 384;
const BIRD_WIDTH = 36;
const BIRD_HEIGHT = 26;
const TUBE_WIDTH = 52;
const TUBE_HEIGHT = 320;
const SCORE_OFFSET = 2;

//位置量
const BG_Y = -70;
const GROUND_Y = 320;
const BIRD_X = 50;
const BIRD_POSITION = (CANVAS_HEIGHT - BIRD_HEIGHT) / 2;
const GROUND_OFFSET = 48;
const BIRD_OFFSET_LIMIT = 10;
const TUBE_DISTX = 150;
const TUBE_DISTY = 100;
const TUBE_HIGH = -280;
const TUBE_LOW = -140;
const TUBE_DELAY = 80;
const BIRD_CENTER_X = BIRD_X + BIRD_WIDTH / 2;
const BIRD_MIN_X = BIRD_CENTER_X - Math.sqrt(BIRD_WIDTH * BIRD_WIDTH / 4 + BIRD_HEIGHT * BIRD_HEIGHT / 4);
const BIRD_MAX_X = BIRD_CENTER_X + Math.sqrt(BIRD_WIDTH * BIRD_WIDTH / 4 + BIRD_HEIGHT * BIRD_HEIGHT / 4);

//其他参数
const BIRD_CHANGE_NUM = 10;

//速度 加速度 角度量
const GRAVITY = 1000;
const FLAP = 320;
const XSPEED = 4;
const BIRD_ANGLE_DOWN_STEP = PI;
const BIRD_ANGLE_UP_STEP = -16 * PI;
const BIRD_UP_SPEED = 30;
const BIRD_MAX_UP_ANGLE = -PI / 6;
const BIRD_MAX_DOWN_ANGLE = PI / 2;

//游戏状态
const WELCOME = 0;
const PLAYING = 1;
const DYING = 2;
const END = 3;

// 全局变量
let Canvas = document.getElementById('canvas');
let Context = Canvas.getContext('2d', {willReadFrequently: true});
let GroundImg = document.getElementById('ground');
let BirdImg = document.getElementById('bird');
let TubeImg1 = document.getElementById('tube_down');
let TubeImg2 = document.getElementById('tube_up');
let BgImg = document.getElementById('bg');
let storage = window.localStorage;

let AudioHit = document.getElementById("audio_hit");
let AudioFlap = document.getElementById("audio_flap");
let AudioDie = document.getElementById("audio_die");
let AudioSwoosh = document.getElementById("audio_swoosh");
let AudioPoint = document.getElementById("audio_point");

// 兼容RequestAnimationFrame
(function () {
    let lastTime = 0;
    let prefixes = 'webkit moz ms o'.split(' '); //各浏览器前缀

    let requestAnimationFrame = window.requestAnimationFrame;
    let cancelAnimationFrame = window.cancelAnimationFrame;

    let prefix;
    //通过遍历各浏览器前缀，来得到requestAnimationFrame和cancelAnimationFrame在当前浏览器的实现形式
    for (let i = 0; i < prefixes.length; i++) {
        if (requestAnimationFrame && cancelAnimationFrame) {
            break;
        }
        prefix = prefixes[i];
        requestAnimationFrame = requestAnimationFrame || window[prefix + 'RequestAnimationFrame'];
        cancelAnimationFrame = cancelAnimationFrame || window[prefix + 'CancelAnimationFrame'] || window[prefix + 'CancelRequestAnimationFrame'];
    }

    // 如果当前浏览器不支持requestAnimationFrame和cancelAnimationFrame，则降级成setTimeout
    if (!requestAnimationFrame || !cancelAnimationFrame) {
        console.log("浏览器不支持requestAnimationFrame，降级成setTimeout")
        requestAnimationFrame = function (callback) {
            let currTime = new Date().getTime();
            //为了使setTimteout的尽可能的接近每秒60帧的效果
            let timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
            let id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

        cancelAnimationFrame = function (id) {
            window.clearTimeout(id);
        };
    }

    //得到兼容各浏览器的API
    window.requestAnimationFrame = requestAnimationFrame;
    window.cancelAnimationFrame = cancelAnimationFrame;
})();

/**
 * 音效播放
 */
class Sounder {
    constructor() {
        this.audioMap = {
            "hit": AudioHit,
            "flap": AudioFlap,
            "die": AudioDie,
            "swoosh": AudioSwoosh,
            "point": AudioPoint
        };
    }

    playSound(action) {
        // 复制一个dom节点，再播放。不然音效会顿卡
        this.audioMap[action].cloneNode().play();
    }

    playFlap() {
        this.playSound("flap");
    }

    playHit() {
        this.playSound("hit");
    }

    playPoint() {
        this.playSound("point");
    }

    playDie() {
        this.playSound("die");
    }

    playSwoosh() {
        this.playSound("swoosh");
    }
}

let Sound = new Sounder();

/**
 * vector向量类
 */
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x = this.x + v.x;
        this.y = this.y + v.y;
    }

    subtract(v) {
        this.x = this.x - v.x;
        this.y = this.y - v.y;
    }

    multiply(f) {
        return new Vector(this.x * f, this.y * f);
    }
}

/**
 * sprite精灵类 继承vector
 */
class Sprite extends Vector {
    constructor(img, sx, sy, sw, sh, ifCut, x, y, angle) {
        super(x, y);
        this.img = img;
        this.sx = sx;
        this.sy = sy;
        this.width = sw;
        this.height = sh;
        this.ifCut = ifCut;
        this.angle = angle;
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
    }

    draw(context) {
        context.save();
        //不需要旋转的对象
        if (this.angle == 0) {
            if (this.ifCut) {
                //其实最后两个参数代表画出来图的大小 用于缩放 我们不需要缩放 所以直接用截取的大小
                context.drawImage(this.img, this.sx, this.sy, this.width, this.height, this.x, this.y, this.width, this.height);
            } else {
                //不需要截取 直接画
                context.drawImage(this.img, this.x, this.y);
            }
        } else {
            //需要旋转
            context.translate(this.x + this.halfWidth, this.y + this.halfHeight);
            context.rotate(this.angle);//旋转角度
            if (this.ifCut) {
                //其实最后两个参数代表画出来图的大小 用于缩放 我们不需要缩放 所以直接用截取的大小
                context.drawImage(this.img, this.sx, this.sy, this.width, this.height, -this.halfWidth, -this.halfHeight, this.width, this.height);
            } else {
                //不需要截取 直接画
                context.drawImage(this.img, -this.halfWidth, -this.halfHeight);
            }
        }
        context.restore();
    }

    drawWithAngle(context, angle, centerx, centery) {
        context.save();
        //不需要旋转的对象
        if (angle == 0) {
            if (this.ifCut) {
                //其实最后两个参数代表画出来图的大小 用于缩放 我们不需要缩放 所以直接用截取的大小
                context.drawImage(this.img, this.sx, this.sy, this.width, this.height, this.x, this.y, this.width, this.height);
            } else {
                //不需要截取 直接画
                context.drawImage(this.img, this.x, this.y);
            }
        } else {
            //需要旋转
            context.translate(centerx, centery);
            context.rotate(angle);//旋转角度
            if (this.ifCut) {
                //其实最后两个参数代表画出来图的大小 用于缩放 我们不需要缩放 所以直接用截取的大小
                context.drawImage(this.img, this.sx, this.sy, this.width, this.height, this.x - centerx, this.y - centery, this.width, this.height);
            } else {
                //不需要截取 直接画
                context.drawImage(this.img, this.x - centerx, this.y - centery);
            }
        }
        context.restore();
    }
}

/**
 * ground地面 继承sprite
 */
class Ground extends Sprite {
    constructor(img, sx, sy, sw, sh, ifCut, x, y, angle) {
        super(img, sx, sy, sw, sh, ifCut, x, y, angle);
    }

    update(game) {
        if (game.status == WELCOME || game.status == PLAYING) {
            this.x -= game.option.groundMovePx * (game.duration * game.option.FPS / 1000);
            if (this.x < -GROUND_OFFSET) {
                this.x = 0;
            }
        }
    }
}

/**
 * tube管道 继承sprite
 */
class Tube extends Sprite {
    constructor(img, sx, sy, sw, sh, ifCut, x, y, angle) {
        super(img, sx, sy, sw, sh, ifCut, x, y, angle, null);
    }

    update(game) {
        if (game.status == WELCOME || game.status == PLAYING) {
            this.x -= game.option.groundMovePx * (game.duration * game.option.FPS / 1000);
        }
    }

    randY() {
        this.y = TUBE_LOW - (TUBE_LOW - TUBE_HIGH) * Math.random();
    };
}

/**
 * bird小鸟 继承sprite
 */
class Bird extends Sprite {
    constructor(img, sx, sy, sw, sh, ifCut, x, y, angle) {
        super(img, sx, sy, sw, sh, ifCut, x, y, angle);
        this.birdIndex = 0;
        this.birdChangeDirection = 1;
        this.velocity = new Vector(0, -BIRD_UP_SPEED);
    };

    update(game) {
        this.changeBirdIndex(game);
        if (game.status == PLAYING) {
            //向上撞到墙顶 失去速度
            if (this.y <= 0 && this.velocity.y < 0) {
                this.velocity.y = 0;
                return;
            }
            if (this.y >= GROUND_Y - BIRD_HEIGHT) {
                Sound.playHit();
                game.status = END;
                return;
            }
            this.add(this.velocity.multiply(game.option.dt * (game.duration * game.option.FPS / 1000)));
            this.velocity.add(game.option.acceleration.multiply(game.option.dt * (game.duration * game.option.FPS / 1000)));
            //向上飞的时候 头朝上
            if (this.velocity.y < 0) {
                this.angle += game.option.birdAngleUpStep * (game.duration * game.option.FPS / 1000);
                if (this.angle < BIRD_MAX_UP_ANGLE) {
                    this.angle = BIRD_MAX_UP_ANGLE;
                }
            } else {
                this.angle += game.option.birdAngleDownStep * (game.duration * game.option.FPS / 1000);
                if (this.angle > BIRD_MAX_DOWN_ANGLE) {
                    this.angle = BIRD_MAX_DOWN_ANGLE;
                }
            }

        } else if (game.status == DYING) {
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
            }
            if (this.y >= GROUND_Y - BIRD_HEIGHT) {
                game.status = END;
                return;
            }
            this.add(this.velocity.multiply(game.option.dt * (game.duration * game.option.FPS / 1000)));
            this.velocity.add(game.option.acceleration.multiply(game.option.dt * (game.duration * game.option.FPS / 1000)));
            if (this.velocity.y < 0) {
                this.angle += game.option.birdAngleUpStep * (game.duration * game.option.FPS / 1000);
                if (this.angle < BIRD_MAX_UP_ANGLE) {
                    this.angle = BIRD_MAX_UP_ANGLE;
                }
            } else {
                this.angle += game.option.birdAngleDownStep * (game.duration * game.option.FPS / 1000);
                if (this.angle > BIRD_MAX_DOWN_ANGLE) {
                    this.angle = BIRD_MAX_DOWN_ANGLE;
                }
            }

        } else if (game.status == WELCOME) {
            this.add(this.velocity.multiply(game.option.dt * (game.duration * game.option.FPS / 1000)));
            if (this.y > BIRD_POSITION + BIRD_OFFSET_LIMIT || this.y < BIRD_POSITION - BIRD_OFFSET_LIMIT) {
                this.velocity.y = -this.velocity.y;
            }
        }

    }

    changeBirdIndex(game) {
        this.birdIndex += game.option.birdChangeStep * (game.duration * game.option.FPS / 1000);//1秒钟换10次
        if (this.birdIndex > 1) {
            this.sx += BIRD_WIDTH * this.birdChangeDirection;
            if (this.sx == 0 || this.sx == 2 * BIRD_WIDTH) {
                this.birdChangeDirection = -this.birdChangeDirection;
            }
            this.birdIndex = 0;
        }
    }

    ifHit(spriteArr) {
        if (spriteArr.length < 2) {
            return false;
        }
        // 搞个临时canvas 用来判断碰撞
        let canvas = document.createElement('canvas');
        canvas.setAttribute('width', CANVAS_WIDTH);
        canvas.setAttribute('height', CANVAS_HEIGHT);
        let context = canvas.getContext('2d', {willReadFrequently: true});

        //this.draw(context);
        //用这种不带角度的draw把鸟平铺
        this.drawWithAngle(context, 0, 0, 0);
        //原来的方法其实不准，因为取出来是按照没有旋转来取的 现在改成把鸟平放，水管斜着放
        let data1 = context.getImageData(this.x, this.y, this.width, this.height).data;
        context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        for (let i = 0; i < spriteArr.length; i++) {
            //这里做优化 this.x其实是固定的 加上倾斜以后最大位置的判断 不然会漏掉
            //if(spriteArr[i].x+TUBE_WIDTH<this.x || spriteArr[i].x>this.x+BIRD_WIDTH)
            if (spriteArr[i].x + TUBE_WIDTH < BIRD_MIN_X || spriteArr[i].x > BIRD_MAX_X) {
                continue;
            }
            //把水管绕小鸟的中心反过来转。。等于小鸟转了
            spriteArr[i].drawWithAngle(context, -this.angle, BIRD_CENTER_X, this.y - BIRD_WIDTH / 2);
        }
        let data2 = context.getImageData(this.x, this.y, this.width, this.height).data;
        for (let i = 3; i < data1.length; i += 4) {
            if (data1[i] > 0 && data2[i] > 0)
                return true;
        }
        return false;
    }
}

/**
 * TubeQueue水管队列 封装一些tube的操作
 */
class TubeQueue {
    constructor() {
        this.tubes = [];
        this.noTubeDist = 0;//已经多长距离没出现管子了
        this.tubesX = [];
    }

    draw(context) {
        for (let i = 0; i < this.tubes.length; i++) {
            this.tubes[i].draw(context);
        }
    }

    update(game) {
        if (game.status == WELCOME || game.status == END || game.status == DYING) {
            return;
        }
        if (this.noTubeDist > TUBE_DISTX + TUBE_WIDTH) {
            this.addTube();
            this.noTubeDist = 0;
        }
        if (this.tubes.length > 1) {
            //去掉已经越过边界的水管
            if (this.tubes[0].x < -TUBE_WIDTH) {
                this.tubes.shift();
                this.tubes.shift();
            }
            //把剩下的每个水管画一遍
            for (let i = 0; i < this.tubes.length; i++) {
                this.tubes[i].update(game);
            }
        }
        if (this.tubesX.length > 0) {
            if (this.tubesX[0] < BIRD_X + BIRD_WIDTH - SCORE_OFFSET) {
                Sound.playPoint();
                game.score++;
                this.tubesX.shift();
            }
            for (let i = 0; i < this.tubesX.length; i++) {
                this.tubesX[i] -= game.option.groundMovePx * (game.duration * game.option.FPS / 1000);
            }
        }
        this.noTubeDist += game.option.groundMovePx * (game.duration * game.option.FPS / 1000);
    }

    addTube() {
        let tube1 = new Tube(TubeImg1, 0, 0, TUBE_WIDTH, TUBE_HEIGHT, false, CANVAS_WIDTH + TUBE_DELAY, 0, 0);
        tube1.randY();
        let tube2 = new Tube(TubeImg2, 0, 0, TUBE_WIDTH, TUBE_HEIGHT, false, CANVAS_WIDTH + TUBE_DELAY, 0, 0);
        tube2.y = tube1.y + TUBE_HEIGHT + TUBE_DISTY;
        this.tubes.push(tube1);
        this.tubes.push(tube2);
        this.tubesX.push(tube1.x);
    }
}

/**
 * 游戏主逻辑
 */
class Option {
    constructor() {
        this.gravity = GRAVITY;
        this.flap = FLAP;
        this.xSpeed = XSPEED;
        this.FPS = FPS;

        this.groundMovePx = GROUND_OFFSET * this.xSpeed / this.FPS;
        this.birdChangeStep = BIRD_CHANGE_NUM / this.FPS;
        this.birdAngleDownStep = BIRD_ANGLE_DOWN_STEP / this.FPS;
        this.birdAngleUpStep = BIRD_ANGLE_UP_STEP / this.FPS;

        this.dt = 1 / this.FPS;
        this.acceleration = new Vector(0, this.gravity);
    }
}

class Game {
    constructor() {
        this.option = new Option();
        this.reset();
    }

    reset() {
        // 重置状态和精灵
        this.status = WELCOME;
        this.score = 0;
        this.lastRenderTime = performance.now()
        this.birdSprite = new Bird(BirdImg, BIRD_WIDTH, 0, BIRD_WIDTH, BIRD_HEIGHT, true, BIRD_X, BIRD_POSITION, 0);
        this.bgSprite = new Sprite(BgImg, 0, 0, 0, 0, false, 0, BG_Y, 0);
        this.groundSprite = new Ground(GroundImg, 0, 0, 0, 0, false, 0, GROUND_Y, 0);
        this.tubeQueue = new TubeQueue();
    }

    start() {
        this.intervalId = window.requestAnimationFrame(this.loop.bind(this));
        //let intervalId = setInterval(function(){that.loop(intervalId);},1000/this.option.FPS)
    }

    loop(renderTime) {
        // ms精度
        this.duration = renderTime - this.lastRenderTime;
        this.lastRenderTime = renderTime;

        //画背景 不需要clear因为背景直接覆盖了
        this.bgSprite.draw(Context);

        // TODO 精灵的update依赖game，不合理

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

        Context.textBaseline = 'top';
        Context.textAlign = 'center';
        Context.fillStyle = '#fff';
        if (this.status == WELCOME) {
            Context.font = 'bold 25px Arial ';
            Context.fillStyle = '#F9E79F';
            Context.fillText("Flappy Bird", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 4 - 15);
            Context.strokeText("Flappy Bird", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 4 - 15);
            Context.fillStyle = '#fff';
            Context.font = 'bold 15px Arial ';
            Context.fillText("ported version", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 4 + 15);
            // Context.strokeText("ported version", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 4 + 15);
            Context.fillText("TAP TO START", CANVAS_WIDTH / 2, 2 * CANVAS_HEIGHT / 3);
            Context.strokeText("TAP TO START", CANVAS_WIDTH / 2, 2 * CANVAS_HEIGHT / 3);
        } else {
            Context.font = 'bold 30px Arial ';
            Context.fillText(this.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 6);
            Context.strokeText(this.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 6);
        }
        Context.restore();

        if (this.status == END) {
            if (storage.getItem('high_score') == null || storage.getItem('high_score') <= this.score) {
                try {
                    storage.removeItem('high_score');
                    storage.setItem('high_score', this.score);
                } catch (e) {
                    alert("您处于无痕浏览，无法为您保存分数。");
                }
            }

            Context.save();
            Context.fillStyle = '#fff';
            Context.textBaseline = 'top';
            Context.textAlign = 'center';

            Context.font = 'bold 25px Arial ';
            Context.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
            Context.strokeText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
            Context.font = 'bold 15px Arial ';
            Context.fillStyle = '#F9E79F';
            Context.fillText("BEST RECORD " + storage.getItem('high_score'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 40);
            Context.strokeText("BEST RECORD " + storage.getItem('high_score'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 40);
            Context.font = 'bold 15px Arial ';
            Context.fillStyle = '#fff';
            Context.fillText("TAP TO TRY AGAIN", CANVAS_WIDTH / 2, 2 * CANVAS_HEIGHT / 3);
            Context.strokeText("TAP TO TRY AGAIN", CANVAS_WIDTH / 2, 2 * CANVAS_HEIGHT / 3);
            Context.restore();

            window.cancelAnimationFrame(this.intervalId);
            return;
        }

        if (this.status == PLAYING) {
            if (this.birdSprite.ifHit(this.tubeQueue.tubes)) {
                this.status = DYING;
                Sound.playDie();
                Sound.playHit();
            }
        }
        window.requestAnimationFrame(this.loop.bind(this));
    }

    touch() {
        switch (this.status) {
            case WELCOME:
                Sound.playFlap();
                this.birdSprite.velocity.y = -this.option.flap;
                this.status = PLAYING;
                break;
            case PLAYING:
                Sound.playFlap();
                this.birdSprite.velocity.y = -this.option.flap;
                break;
            case DYING:
                break;
            case END:
                Sound.playSwoosh();
                this.reset();
                this.start();
                break;
        }
    }
}

// 调整画布大小
function resize() {
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let canvasWidth = Canvas.width;
    let canvasHeight = Canvas.height;
    let ratio = canvasHeight / canvasWidth;
    if (windowWidth * ratio >= windowHeight)//把竖着的填满
    {
        Canvas.style.height = windowHeight + 'px';
        Canvas.style.width = windowHeight / ratio + 'px';
    } else {//把横着的填满
        Canvas.style.width = windowWidth + 'px';
        Canvas.style.height = windowWidth * ratio + 'px';
    }
}

(function () {
    // 首先调整下画布
    resize();
    // 游戏对象
    let game = new Game();

    // 注册交互事件
    window.addEventListener('resize', resize, false);

    window.addEventListener('touchmove', function (e) {
        e.stopPropagation();
        e.preventDefault();
    });

    if (document.hasOwnProperty("ontouchstart")) {
        window.addEventListener('touchstart', function (e) {
            game.touch();
        });
    } else {
        window.addEventListener('click', function (e) {
            game.touch();
        });
        window.addEventListener('keydown', function (e) {
            if (e.key == " ") {
                game.touch();
            }
        })
    }

    // 游戏开始
    game.start();
})();
