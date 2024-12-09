class Ship extends PIXI.Sprite {
    constructor(x = 0 , y = 0) {
        super(app.loader.resources["images/spaceship.png"].texture);
        this.anchor.set(.5, .5); // position, scaling, rotating etc are now from center of sprite
        this.scale.set(0.1) ;
        this.x = x;
        this.y = y;
    }
}



class Paddle extends PIXI.Graphics{
    constructor( color = 0xFFFFFF, x=0, y=0){
        super();
        
        this.beginFill(color);
        this.drawRect(0, 0, 100, 17);
        this.endFill();
        this.x = x;
        this.y = y;
        //this.radius = radius;
        //varibles
        this.fwd = getRandomUnitVector();
        this.speed = 50;
        this.isAlive = true;
    }
}

class Circle extends PIXI.Graphics{
    constructor(radius, speedModify = 1 , x=0, y=0){
        super();
        
        this.beginFill(0xFFFFFF);
        this.drawCircle(0,0,radius);
       
        this.endFill();
        this.x = x;
        this.y = y;
        this.radius = radius;
        //varibles
        this.fwd = getRandomUnitVector();
        this.speed = 50 * speedModify;
        this.isAlive = true;
    }

    
    

    move(dt=1/60){
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt; 
    }

    reflectX(){
        this.fwd.x *= -1;
    }

    reflectY(){
        this.fwd.y *= -1;
    }

    makeYGoUp(){
        
        if(this.fwd.y > 0){
        this.fwd.y *= -1;}

    }
}

class Brick extends PIXI.Graphics{
    constructor( brickNumber = 0 , x=0, y=0 ){
        super();
        let color;
        if (brickNumber >= 0 && brickNumber <= 9){
              color = 0xFF0000 //red
            } else if ( brickNumber <= 19){
                color = 0xFF5500 //orange
              } else if ( brickNumber <= 29){
                color = 0xFFFF00 //yellow
              } else if ( brickNumber <= 39){
                color = 0x15FF00 //green
              } else if ( brickNumber <= 49){
                color = 0x0000FF // blue
              } else {color =0xFFFFFF } // white, fail safe

        this.beginFill(color);
        this.drawRect(0, 0, sceneWidth / 10 , 20);
        this.endFill();
        this.x = x;
        this.y = y;
        //this.radius = radius;
        //varibles
        this.fwd = getRandomUnitVector();
        this.speed = 50;
        this.isAlive = true;
    }
}

class Bullet extends PIXI.Graphics{
    constructor(color=0xFFFFFF, x=0, y=0){
        super();
        this.beginFill(color);
        this.drawRect(-2,-3,4,6);
        this.endFill();
        this.x = x;
        this.y = y;
        //variables 
        this.fwd = {x:0,y:-1};
        this.speed = 400;
        this.isAlive = true;
        Object.seal(this);
    }
    move(dt=1/60){
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }
}