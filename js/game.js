window.onload = function() {
    var innerWidth = window.innerWidth;
    var innerHeight = window.innerHeight;
    var gameRatio = innerWidth/innerHeight;
    var game = new Phaser.Game(Math.floor(480*gameRatio), 480, Phaser.CANVAS);
    var ninja;
    var ninjaGravity = 0;
    var ninjaJumpPower;
    var score=0;
    var scoreText;
    var topScore;
    var powerBar;
    var powerTween;
    var jumpinTween;
    var placedPoles;
    var poleGroup;
    var minPoleGap = 100;
    var maxPoleGap = 300;
    var ninjaJumping;
    var ninjaFallingDown;
    var road;
	var runningTween;
	var roadTween;
	var runFlag;
    var play = function(game) {}
    play.prototype = {
		preload:        function() {
            game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT ;
            game.scale.setScreenSize(true);//80,90,4
            game.load.spritesheet("ninja", "assests/images/ninja.png");
            game.load.image("pole", "assests/images/pole.png");
            game.load.image("powerbar", "assests/images/powerbar.png");

            game.load.image('backyard', 'assests/images/background.png');
            game.load.image('road','assests/images/road.jpg');
            //game.background = game.add.sprite(0,0, 'backyard');

        },
		create:        function() {
            ninjaJumping = false;
            ninjaFallingDown = false;
            score = 0;
            game.background = game.add.sprite(0,0, 'backyard');
            placedPoles = 0;
            poleGroup = game.add.group();
            topScore = localStorage.getItem("topFlappyScore")==null?0:localStorage.getItem("topFlappyScore");
            scoreText = game.add.text(10,10,"-", {
												font:"bold 16px Arial"
            });
            updateScore();
            game.stage.backgroundColor = "#87CEEB";
            game.physics.startSystem(Phaser.Physics.ARCADE);

            road = game.add.sprite(0,410,"road");
			//road.width = 100;
            ninja = game.add.sprite(50,400,"ninja");
            ninja.anchor.set(0.5);
            ninja.lastPole = 1;


            ninja.animations.add('walk');

            ninja.animations.play('walk', 3, true);
            console.log("game.width" + game.width);
            //runningTween = game.add.tween(ninja).to({ x: game.width }, 10000, Phaser.Easing.Linear.None, true);
			//roadTween = game.add.tween(road).to({ x: -450 }, 5000, Phaser.Easing.Linear.None, true);
			
            game.physics.arcade.enable(road);
			road.body.velocity.x = -100;
            game.physics.arcade.enable(ninja);
            ninja.body.gravity.y = ninjaGravity;
            game.input.onDown.add(prepareToJump, this);
			runFlag = true;
            addPole(600);
        },
		update:        function() {
            if (ninja.body.x ==250)
            {
				ninja.animations.stop();
				runningTween.stop();
            //ninja.body.velocity.x += 0.01;
            //ninja.scale.y += 0.01;
            }
			if(road.x==(-450)){
				runFlag = true;
			}
			else if(road.x <-(450)){
				runFlag = false;
			}
            game.physics.arcade.collide(ninja, poleGroup, checkLanding);
            if (ninja.y>game.height) {
                die();
            }
        }
    }
    game.state.add("Play",play);
    game.state.start("Play");
    function updateScore() {
        scoreText.text = "Score: "+score+"\nBest: "+topScore;
    }
    function prepareToJump() {
        if (ninja.body.velocity.y==0) {
            powerBar = game.add.sprite(ninja.x,ninja.y-50,"powerbar");
            powerBar.width = 0;
			powerTween = game.add.tween(powerBar).to( {width:100}, 1000, "Linear",true);
            game.input.onDown.remove(prepareToJump, this);
            game.input.onUp.add(jump, this);
        }
    }
    function jump() {

        ninja.body.gravity.y = 800;
        ninja.animations.add('walk');

        ninja.animations.play('walk', 3, false);

jumpinTween = game.add.tween(ninja).to( { x: ninjaJumpPower*2 }, 10000, Phaser.Easing.Linear.None, true);

        ninjaJumpPower= -powerBar.width*3-100
                        powerBar.destroy();
		
		road.body.velocity.x = ninjaJumpPower;
        game.tweens.removeAll();
        ninja.body.velocity.y = ninjaJumpPower*2;
        ninjaJumping = true;
        powerTween.stop();
        game.input.onUp.remove(jump, this);
    }
    function addNewPoles() {
        var maxPoleX = 0;
        poleGroup.forEach(function(item) {
            maxPoleX = Math.max(item.x,maxPoleX)
                   });
        var nextPolePosition = maxPoleX + game.rnd.between(minPoleGap,maxPoleGap);
        addPole(nextPolePosition);
    }
    function addPole(poleX) {
        if (poleX<game.width*2) {
            placedPoles++;
            var pole = new Pole(game,poleX,game.rnd.between(250,380));
            game.add.existing(pole);
            pole.anchor.set(0.5,0);
            poleGroup.add(pole);
            var nextPolePosition = poleX + game.rnd.between(minPoleGap,maxPoleGap);
            addPole(nextPolePosition);
        }
    }
    function die() {
        localStorage.setItem("topFlappyScore",Math.max(score,topScore));
		ninjaJumpPower = -100;
        game.state.start("Play");
    }
    function checkLanding(n,p) {

        if (p.y>=n.y+n.height/2) {

            var border = n.x-p.x
            if (Math.abs(border)>20) {
                n.body.velocity.x=border*2;
                n.body.velocity.y=-200;
            }
            var poleDiff = p.poleNumber-n.lastPole;
            if (poleDiff>0) {
                score+= Math.pow(2,poleDiff);
                updateScore();
                n.lastPole= p.poleNumber;
            }
            if (ninjaJumping) {
                ninjaJumping = false;
                console.log("tween stopped");
                jumpinTween.pause();
                game.input.onDown.add(prepareToJump, this);
            }
        }
        else {
            ninjaFallingDown = true;
            jumpinTween.stop();
            poleGroup.forEach(function(item) {
                item.body.velocity.x = 0;
            });
        }
    }
    Pole = function (game, x, y) {
        Phaser.Sprite.call(this, game, x, y, "pole");
        game.physics.enable(this, Phaser.Physics.ARCADE);
        this.body.immovable = true;
        this.poleNumber = placedPoles;
    };
    Pole.prototype = Object.create(Phaser.Sprite.prototype);
    Pole.prototype.constructor = Pole;
    Pole.prototype.update = function() {
        if (ninjaJumping && !ninjaFallingDown || runFlag) {
			if(ninjaJumpPower!=undefined){
				//road.x = ;
				this.body.velocity.x = ninjaJumpPower;
			}
			else{
				this.body.velocity.x = -100;
				}
        }
        else {
            this.body.velocity.x = 0
                               }
        if (this.x<-this.width) {
            this.destroy();
            addNewPoles();
        }
    }

}