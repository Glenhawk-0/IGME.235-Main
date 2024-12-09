// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";



const app = new PIXI.Application({
	width: 600,
	height: 600
});
document.body.appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;

// pre-load the images (this code works with PIXI v6)
app.loader.
	add([
		"images/spaceship.png",
		"images/explosions.png"
	]);
app.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
app.loader.onComplete.add(setup);
app.loader.load();

// pre-load the images (this code works with PIXI v7)
// let assets;
// loadImages();
// async function loadImages(){
// // https://github.com/pixijs/pixijs/wiki/v7-Migration-Guide#-replaces-loader-with-assets
// // https://pixijs.io/guides/basics/assets.html
// PIXI.Assets.addBundle('sprites', {
//   spaceship: 'images/spaceship.png',
//   explosions: 'images/explosions.png',
//   move: 'images/move.png'
// });
//
// assets = await PIXI.Assets.loadBundle('sprites');
// setup();
// }

// aliases
let stage;

// game variables
let startScene;
let gameScene, ship, paddle, scoreLabel, levelLabel, lifeLabel, shootSound, hitSound, fireballSound;
let gameOverScene;

let bricks =[];
let circles = [];
let bullets = [];
let aliens = [];
let explosions = [];
let explosionTextures;
let score = 0;

let life = 5;
let levelNum = 1;
let paused = true;

function setup() {
	stage = app.stage;
	// #1 - Create the `start` scene
	startScene = new PIXI.Container();
	stage.addChild(startScene);

	// #2 - Create the main `game` scene and make it invisible
	gameScene = new PIXI.Container();
	gameScene.visible = false;
	stage.addChild(gameScene);

	// #3 - Create the `gameOver` scene and make it invisible
	gameOverScene = new PIXI.Container();
	gameOverScene.visible = false;
	stage.addChild(gameOverScene);

	// #4 - Create labels for all 3 scenes
	createLabelsAndButtons();

	/* #5 - Create ship
	ship = new Ship();
	gameScene.addChild(ship);*/


	//#5+ create paddle
	paddle = new Paddle();
	gameScene.addChild(paddle)

	// #6 - Load Sounds
		shootSound  = new Howl({
			src:['sounds/shoot.wav']
		});

		hitSound = new Howl ({
			src: ['sounds/hit.mp3']
		});

		fireballSound = new Howl ({
			src: ['sounds/fireball.mp3']
		});
	// #7 - Load sprite sheet
	explosionTextures = loadSpriteSheet();

	// #8 - Start update loop
	app.ticker.add(gameLoop);

	// #9 - Start listening for click events on the canvas
	app.view.onclick = fireBullet;

	// Now our `startScene` is visible
	// Clicking the button calls startGame()
} //end of setup function


function createLabelsAndButtons() {
	let buttonStyle = new PIXI.TextStyle({
		fill: 0xFF0000,
		fontSize: 48,
		fontFamily: "Verdana"

	});

	// 1 - set up `startScene`
	// 1A - make top start label
	let startLabel1 = new PIXI.Text("BreakOut!");
	startLabel1.style = new PIXI.TextStyle({
		fill: 0xFF0000,
		fontSize: 96,
		fontFamily: "Verdana",
		stroke: 0xFF0000,
		strokeThickness: 6
	})
	startLabel1.x = 50;
	startLabel1.y = 120;
	startScene.addChild(startLabel1);

	// 1B - make middle start label
	let startLabel2 = new PIXI.Text("Will I pass?... i hope");
	startLabel2.style = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 32,
		fontFamily: "Verdana",
		fontStyle: "italic",
		stroke: 0xFF0000,
		strokeThickness: 6
	})
	startLabel2.x = 185;
	startLabel2.y = 300;
	startScene.addChild(startLabel2);

	// 1C - make start game button     
	let startButton = new PIXI.Text("Start the game NERD");
	startButton.style = buttonStyle;
	startButton.x = 80;
	startButton.y = sceneHeight - 100;
	startButton.interactive = true;
	startButton.buttonMode = true;
	startButton.on("pointerup", startGame); // startGame is a function reference
	startButton.on('pointerover', e => e.target.alpha = 0.7); // concise arrow with no brackets
	startButton.on('pointerout', e => e.currentTarget.alpha = 1.0); // ditto /**/ 
	startScene.addChild(startButton);


	// 2 - set up `gameScene`
	let textStyle = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 18,
		fontFamily: "Verdana",
		stroke: 0xFF0000,
		strokeThickness: 4
	});

	//2A - make score label
	scoreLabel = new PIXI.Text();
	scoreLabel.style = textStyle;
	scoreLabel.x = 5;
	scoreLabel.y = 5;
	gameScene.addChild(scoreLabel);
	increaseScoreBy(0);

		//2B - make score label
		levelLabel = new PIXI.Text();
		levelLabel.style = textStyle;
		levelLabel.x = sceneWidth - 100;
		levelLabel.y = 5;
		gameScene.addChild(levelLabel);
		increaseLevelBy(0);

	// 2C - make life label
	lifeLabel = new PIXI.Text();
	lifeLabel.style = textStyle;
	lifeLabel.x = 5;
	lifeLabel.y = 26;
	gameScene.addChild(lifeLabel);
	decreaseLifeBy(0);

	
	// 3 - set up `gameOverScene`
	// 3A - make game over text
	let gameOverText = new PIXI.Text("Game Over!\n        :-O\n\nFinal score: " +  score  +" " );
	textStyle = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 64,
		fontFamily: "Verdana",
		stroke: 0xFF0000,
		strokeThickness: 6
	});
	gameOverText.style = textStyle;
	gameOverText.x = 100;
	gameOverText.y = sceneHeight / 2 - 160;
	gameOverScene.addChild(gameOverText);

	// 3B - make "play again?" button
	let playAgainButton = new PIXI.Text("Play Again?");
	playAgainButton.style = buttonStyle;
	playAgainButton.x = 150;
	playAgainButton.y = sceneHeight - 100;
	playAgainButton.interactive = true;
	playAgainButton.buttonMode = true;
	playAgainButton.on("pointerup", startGame); // startGame is a function reference
	playAgainButton.on('pointerover', e => e.target.alpha = 0.7); // concise arrow function with no brackets
	playAgainButton.on('pointerout', e => e.currentTarget.alpha = 1.0); // ditto
	gameOverScene.addChild(playAgainButton);

}//end of createLabelsAndButtons


function startGame() {
	startScene.visible = false;
	gameOverScene.visible = false;
	gameScene.visible = true;
	levelNum = 1;
	
	score = 0;
	life  = 5;
	increaseScoreBy(0);
	decreaseLifeBy(0);
	paddle.x = 300;
	paddle.y = 550;
	loadLevel();
}

function increaseScoreBy(value) {
	score += value;
	scoreLabel.text = `Score: ${score}`;
}

function increaseLevelBy(value) {//tech
	levelNum += value;
	//levelNum ++
	levelLabel.text = `Level: ${levelNum}`;
}

function decreaseLifeBy(value) {
	life -= value;
	life = parseInt(life);
	lifeLabel.text = `Lives		${life}`;
}


function gameLoop(){
	 if (paused) return; // keep this commented out for now
	
	// #1 - Calculate "delta time"
	let dt = 1/app.ticker.FPS;
	if (dt > 1/12) dt=1/12;
	
	// #2 - Move paddle
	let mousePosition = app.renderer.plugins.interaction.mouse.global;
	//paddle.position = mousePosition;

	let amt = 6 * dt; // at 60 FPS would move about 10% of distance per update

	// lerp (linear interpolate) the x & y values with lerp()
	let newX = lerp(paddle.x, mousePosition.x - 50, amt);
	let newY = lerp(paddle.y, mousePosition.y, amt);

	// keep the paddle on the screen with clamp()
	let w2 = paddle.width/2;
	let h2 = paddle.height/2;
	paddle.x = clamp(newX, 0,sceneWidth-(w2*2));
	//paddle.y = clamp(newY,0+h2,sceneHeight-h2);
	
	// #3 - Move Circles
	for (let c of circles){
		c.move(dt);
		if (c.x <= c.radius || c.x >= sceneWidth-c.radius){
			c.reflectX();
			c.move(dt);
		}

		if (c.y <= c.radius || c.y >= sceneHeight-c.radius){
			c.reflectY();
			c.move(dt);
		}
	}
	
	// #4 - Move Bullets
	for (let b of bullets){
		b.move(dt);
	}
	
	// #5 - Check for Collisions
	for (let c of circles){
		for(let b of bullets){
		// #5A - circles & bullets
		if (rectsIntersect(c,b)){
			fireballSound.play();
			createExplosion(c.x,c.y,64,64); 
			gameScene.removeChild(c);
			c.isAlive = false;
			gameScene.removeChild(b);
			b.isAlive = false;
			increaseScoreBy(1);
		}
		if (b.y < -10) b.isAlive = false;
	}

	///protype .. we will replace this with a paddle.
		// #5B - circles & paddle
		if (c.isAlive && rectsIntersect(c,paddle)){
			//hitSound.play();
			
			//gameScene.removeChild(c);
			//c.reflectY();
			c.makeYGoUp();
			//c.isAlive = false;
			//decreaseLifeBy(1);
		}
	}
	
	// all done checking for collisions

	// #6 - Now do some clean up
	
	// get rid of dead bullets
	bullets = bullets.filter(b=>b.isAlive);

	//get rid of dead circles
	circles = circles.filter(c=>c.isAlive);

	// get rid of explosions
	explosions = explosions.filter(e=>e.playing);
	
	// #7 - Is game over?
	if (life <= 0){
		
		end();
		return; // return here so we skip #8 below
	}
	
	// #8 - Load next level, 
	if (circles.length == 0){  // Change this to bricks
		//levelNum ++;
		increaseLevelBy(1)
		loadLevel();
		
	}
}
/* old function
function createCircles(numCircles){
	for(let i=0; i<numCircles; i++){
		let c = new Circle(10, 0xFFFF00);
		c.x = Math.random() * (sceneWidth - 50) + 25;
		//c.y = Math.random() * (sceneHeight - 100) + 25; og
		c.y = Math.random() + (300) + 25; //temporary
		circles.push(c);
		gameScene.addChild(c);
	}
}*/
//Keep it simple. Speed increases with each level
function createCircles(speedOfCircle){
	
		let c = new Circle(7, speedOfCircle);
		c.x = Math.random() * (sceneWidth - 50) + 25;
		//c.y = Math.random() * (sceneHeight - 100) + 25; og
		c.y = Math.random() + (300) + 25; //temporary
		circles.push(c);
		gameScene.addChild(c);
	
}

function createBricks(numBricks){
	let layer = 0
	for(let i=0; i<numBricks; i++){
		let divider = i % 10;
		if (divider == 0 ){layer += 1}
		let iterateNum = i;
		while(iterateNum >= 10){
			iterateNum = iterateNum - 10
			
		}
		
		let b = new Brick(i);
		b.x = 0 + (iterateNum * (sceneWidth / 10));
		//c.y = Math.random() * (sceneHeight - 100) + 25; og
	
		b.y = 40 + (20 * layer);
		//console.log("i: " + i + " layer: "+ layer + " b.y: "+ b.y )

		bricks.push(b);
		gameScene.addChild(b);
	}
}

function loadLevel(){
	createCircles((levelNum + 3) * 2 );
	createBricks(50);
	paused = false;
}

function end() {
	paused = true;
	//clear out level
	gameOverScene.children[0].text = ("Game Over!\n        :-O\n\nFinal score: " +  score  +" " );
	circles.forEach(c=>gameScene.removeChild(c)); // concise arrow function with no brackets and no return
	circles = [];

	bullets.forEach(b=>gameScene.removeChild(b)); // ditto
	bullets = [];

	explosions.forEach(e=>gameScene.removeChild(e)); // ditto
	explosions = [];

	gameOverScene.visible = true;
	gameScene.visible = false;
}

function fireBullet(e){
	//let rect = app.view.getBoundingClientRect();
	//let mouseX = e.clientX - rect.x;
	//let mouseY = e.clientY - rect.y;
	//console.log(`${mouseX},${mouseY}`);
	if (paused) return;
	let displace = 15 
	let centering = 50
	let b = [new Bullet(0xFFFFFF, paddle.x + centering -displace , paddle.y) , new Bullet(0xFFFFFF, paddle.x + centering , paddle.y), new Bullet(0xFFFFFF, paddle.x + centering +displace , paddle.y) ]; //new Bullet(0xFFFFFF, paddle.x , paddle.y);
	
	if (score < 9) {
		bullets.push(b[1])
		bullets.push(b[1])
		gameScene.addChild(b[1]);
	}	
	else{	
	for (const element of b){
	bullets.push(element)
	bullets.push(element)
	gameScene.addChild(element);
	}

}
	shootSound.play();
}

function loadSpriteSheet(){
	// the 16 animation frames in each row are 64x64 pixels
	// we are using the second row
	// http://pixijs.download/release/docs/PIXI.BaseTexture.html
	let spriteSheet = PIXI.BaseTexture.from("images/explosions.png");
	let width = 64;
	let height= 64;
	let numFrames = 16;
	let textures = [];
	for (let i = 0; i<numFrames ; i++){
		// http://pixijs.download/release/docs/PIXI.Texture.html
		let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i*width, 64, width, height));
		textures.push(frame);
	}
	return textures;
}
 
function createExplosion(x, y, frameWidth, frameHeight){
	// http://pixijs.download/release/docs/PIXI.AnimatedSprite.html
	// the animation frames are 64x64 pixels
	let w2 = frameWidth / 2;
	let h2 = frameHeight / 2;
	let expl = new PIXI.AnimatedSprite(explosionTextures);
	expl.x = x - w2; // we want the explosions to appear at the center of the circle
	expl.y = y - h2; // ditto
	expl.animationSpeed = 1  / 7; 
	expl.loop = false; 
	expl.onComplete = e => gameScene.removeChild(expl);
	explosions.push(expl)
	gameScene.addChild(expl);
	expl.play();
}