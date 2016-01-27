// Inits
window.onload = function init() {
    var game = new GF();
    game.start();
};


// GAME FRAMEWORK STARTS HERE
var GF = function () {
    // Vars relative to the canvas
    var canvas, ctx, w, h;

    // vars for counting frames/s, used by the measureFPS function
    var frameCount = 0;
    var lastTime;
    var fpsContainer;
    var fps;
    // for time based animation
    var delta, oldTime = 0;

    // vars for handling inputs
    var inputStates = {};

    // game states
    var gameStates = {
        mainMenu: 0,
        gameRunning: 1,
        gameOver: 2,
		win:3
    };
    var currentGameState = gameStates.mainMenu;
    var currentLevel = 1;
    var TIME_BETWEEN_LEVELS = 20000; 
    var currentLevelTime = TIME_BETWEEN_LEVELS;
    var plopSound; // Sound of a ball exploding

    // The vessel !
    var vessel = {
        dead: false,
        x: 10,
        y: 10,
        width: 60,
        height: 40,
        speed: 100 // pixels/s this time !
    };
  
    /**********************************************************************/
	/**********************************************************************/
	/**********************************************************************/
	//SORTIE
    var exit = {
        level: false,
        x: 710,
        y: 420,
        width: 70,
        height: 70
    };
	/**********************************************************************/
	/**********************************************************************/
	/**********************************************************************/
    

    // obstacles
    var obstacles = [];
  
    // array of balls to animate
    var ballArray = [];
    var nbBalls = 5;

    // We want the object to move at speed pixels/s (there are 60 frames in a second)
    // If we are really running at 60 frames/s, the delay between frames should be 1/60
    // = 16.66 ms, so the number of pixels to move = (speed * del)/1000. If the delay is twice
    // longer, the formula works : let's move the rectangle twice longer!
    var calcDistanceToMove = function (delta, speed) {
        //console.log("#delta = " + delta + " speed = " + speed);
        return (speed * delta) / 1000;
    };

    var measureFPS = function (newTime) {

        // test for the very first invocation
        if (lastTime === undefined) {
            lastTime = newTime;
            return;
        }

        //calculate the difference between last & current frame
        var diffTime = newTime - lastTime;

        if (diffTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastTime = newTime;
        }

        //and display it in an element we appended to the 
        // document in the start() function
        fpsContainer.innerHTML = 'FPS: ' + fps;
        frameCount++;
    };

    // clears the canvas content
    function clearCanvas() {
        ctx.clearRect(0, 0, w, h);
    }	
	
    // Functions for drawing the vessel 
    function drawMyVessel(x, y) {
  
        // save the context
        ctx.save();
        
		var vaisseau = new Image();
        vaisseau.src = 'vaiseau.png';
        ctx.drawImage(vaisseau,vessel.x,vessel.y,vessel.width,vessel.height);
        ctx.fill();
		
        ctx.restore();
    }
  
    /**********************************************************************/
	/**********************************************************************/
	/**********************************************************************/
	//SORTIE
    function drawExit(x, y) {

        ctx.save();

		var sortie = new Image();
		sortie.src = 'exit.png';
		ctx.drawImage(sortie,exit.x,exit.y,exit.width,exit.height);


        ctx.restore();
    }
	/**********************************************************************/
	/**********************************************************************/
  
  	function exitLevel() 
	{

            if (rectsOverlap(vessel.x, vessel.y,
                    vessel.width, vessel.height,
                    exit.x, exit.y,
                    exit.width, exit.height)) 
			{
               goToNextLevel();
                
            }

    }
  
/***************************************************/  
/***************************************************/
    function timer(currentTime) {
        var delta = currentTime - oldTime;
        oldTime = currentTime;
        return delta;

    }
    var mainLoop = function (time) {
        //main function, called each frame 
        measureFPS(time);

        // number of ms since last frame draw
        delta = timer(time);

        // Clear the canvas
        clearCanvas();

        if (vessel.dead) {
            currentGameState = gameStates.gameOver;
        }

        switch (currentGameState) {
            case gameStates.gameRunning:

                // draw the vessel            
                drawMyVessel(vessel.x, vessel.y);
            
                //draw exit
                drawExit(exit.x, exit.y);

                // Check inputs and move the vessel
                updatevesselPosition(delta);
                
            /***********************************************/
            /**********************************************/
            /* Création des balles et des obstacles */
                //ajouter les balles 
                updateBalls(delta);
                updateObstacles(delta);
            
                // display Score
                displayScore();

                // decrease currentLevelTime. 
                currentLevelTime -= delta;
                
                //changer de niveau
                if (currentLevelTime < 0) {
                  currentGameState = gameStates.gameOver;   
                }

				exitLevel();  
				
            break;
            
			/***************************************/
			case gameStates.mainMenu:
				ctx.fillStyle = 'blue';
                ctx.fillText("SKY WAR", 330, 100);
				ctx.fillStyle = 'gold';
                ctx.fillText("Appuyer sur SPACE pour jouer", 240, 200);
                ctx.fillText("Déplacer la fusée avec les flèches", 240, 250);
                ctx.fillText("Atteindre la sortie le plus vite sans se faire toucher", 240, 300);
                if (inputStates.space) {
                    startNewGame();
                }
            break;            
            /**********************************/
            //Menu game over
            case gameStates.gameOver:
				ctx.fillStyle = 'blue';
                ctx.fillText("GAME OVER", 330, 100);
				ctx.fillStyle = 'gold';
                ctx.fillText("Appuyer sur SPACE pour rejouer", 240, 200);
                ctx.fillText("Déplacer la fusée avec les flèches", 240, 250);
                ctx.fillText("Level : " + currentLevel, 240, 300);
				ctx.fillText("Time : " + (currentLevelTime / 1000).toFixed(1), 240, 350);
				ctx.fillText("Missiles : " + nbBalls, 240, 400);
                if (vessel.dead) {
                  ctx.fillText("Vous êtes mort !", 240, 450);
                }
                else
                {
                  ctx.fillText("Temps écoulé !", 240, 450);
                }
                if (inputStates.space) {
                    startNewGame();
                }
            break;
			
			/*********************************/
			case gameStates.win:
			//Menu victoire
				ctx.fillText("Bravo ! Vous avez gagné !", 330, 100);
                ctx.fillText("Appuyer sur SPACE pour Rejouer", 240, 200);
                ctx.fillText("Level : " + currentLevel, 240, 250);
				ctx.fillText("Missiles : " + nbBalls, 240, 300);
                if (inputStates.space) 
				{
                    startNewGame();
                }
			break;	
        }

        // call the animation loop every 1/60th of second
        requestAnimationFrame(mainLoop);
    };

  function updateObstacles(delta) {
    for(var i =0; i < obstacles.length; i++) {
      var obstacle = obstacles[i];
          obstacle.move(delta);
          testCollisionObstacleMur(obstacle, canvas);
          obstacle.draw();
    }
 }
  
  function testCollisionObstacleMur(obstacle, canvas) {
        if((obstacle.y + obstacle.h) > canvas.height) {
      obstacle.y = canvas.height-obstacle.h;
      obstacle.speedY = - obstacle.speedY;
    }
    if(obstacle.y < 0 )  {
      obstacle.y = 0;
      obstacle.speedY = - obstacle.speedY;
    }
        if((obstacle.x + obstacle.w) > canvas.width) {
          obstacle.x = canvas.width -obstacle.w;
        obstacle.speedX = - obstacle.speedX;
    } 
    if(obstacle.x < 0) {
          obstacle.x = 0;
        obstacle.speedX = - obstacle.speedX;
    }
  }
  
    function startNewGame() {
        vessel.dead = false;
		obstacles=[];
        currentLevelTime = 20000;
        currentLevel = 1;
        nbBalls = 5;
		vessel.x=10;
		vessel.y=10;
        createBalls(nbBalls);
		creerObstacles(); 
        currentGameState = gameStates.gameRunning;
    }
  
    /********************/
    /* changer de niveau */
    function goToNextLevel() {
		/*
        clearCanvas();
		ctx.fillStyle = 'blue';
		ctx.fillText("Félicitation !", 330, 100);
		ctx.fillStyle = 'gold';
		ctx.fillText("Appuyer sur SPACE pour passer au niveau suivant", 240, 200);
		ctx.fillText("Level : " + currentLevel, 240, 250);
		ctx.fillText("Time : " + (currentLevelTime / 1000).toFixed(1), 240, 350);
		ctx.fillText("Missiles : " + nbBalls, 240, 300);
		
		if (inputStates.space) 
		{*/
			
			currentLevel++;
			nbBalls += 2;
			vessel.x=10;
			vessel.y=10; 
			obstacles=[];
			createBalls(nbBalls);
			currentLevelTime = 20000;
						
		   switch (currentLevel){
			
			case 1:
			startNewGame();
			
			break;
			
			case 2:
			obstacles=[];
			var obstacle1 = new Obstacle(100, 0, 20, 200, 200, 0);
			obstacles.push(obstacle1);
		
			var obstacle2 = new Obstacle(200, 300, 20, 200, 0, 0);
			obstacles.push(obstacle2);

			var obstacle3 = new Obstacle(300, 0, 20, 200, 0, 0);
			obstacles.push(obstacle3);

			var obstacle4 = new Obstacle(400, 300, 20, 200, 0, 0);
			obstacles.push(obstacle4);
		  
			var obstacle5 = new Obstacle(500, 0, 20, 200, 0, 0);
			obstacles.push(obstacle5);
		  
			var obstacle6 = new Obstacle(600, 300, 20, 200, 0, 0);
			obstacles.push(obstacle6);
		  
			var obstacle7 = new Obstacle(700, 0, 20, 200, 0, 200);
			obstacles.push(obstacle7);
			
			break;
			
			case 3:
			obstacles=[];
			var obstacle1 = new Obstacle(100, 0, 20, 200, 0, 0);
			obstacles.push(obstacle1);
		
			var obstacle2 = new Obstacle(200, 300, 20, 200, 0, 0);
			obstacles.push(obstacle2);

			var obstacle3 = new Obstacle(300, 0, 20, 200, 0, 200);
			obstacles.push(obstacle3);

			var obstacle4 = new Obstacle(400, 300, 20, 200, 0, 200);
			obstacles.push(obstacle4);
		  
			var obstacle5 = new Obstacle(500, 0, 20, 200, 0, 200);
			obstacles.push(obstacle5);
		  
			var obstacle6 = new Obstacle(600, 300, 20, 200, 0, 0);
			obstacles.push(obstacle6);
		  
			var obstacle7 = new Obstacle(700, 0, 20, 200, 0, 0);
			obstacles.push(obstacle7);
			
			break;
			
			case 4:
			obstacles=[];
			var obstacle1 = new Obstacle(100, 0, 20, 200, 0, 0);
			obstacles.push(obstacle1);
		
			var obstacle2 = new Obstacle(200, 300, 20, 200, 200, 0);
			obstacles.push(obstacle2);

			var obstacle3 = new Obstacle(300, 0, 20, 200, 0, 300);
			obstacles.push(obstacle3);

			var obstacle4 = new Obstacle(400, 300, 20, 200, 0, 300);
			obstacles.push(obstacle4);
		  
			var obstacle5 = new Obstacle(500, 0, 20, 200, 0, 300);
			obstacles.push(obstacle5);
		  
			var obstacle6 = new Obstacle(600, 300, 20, 200, 0, 0);
			obstacles.push(obstacle6);
		  
			var obstacle7 = new Obstacle(700, 0, 20, 200, 0, 0);
			obstacles.push(obstacle7);
			
			break;
			
			case 5:
			obstacles=[];
			var obstacle1 = new Obstacle(100, 0, 20, 200, 0, 400);
			obstacles.push(obstacle1);
		
			var obstacle2 = new Obstacle(200, 300, 20, 200, 0, 0);
			obstacles.push(obstacle2);

			var obstacle3 = new Obstacle(300, 0, 20, 200, 400, 0);
			obstacles.push(obstacle3);

			var obstacle4 = new Obstacle(400, 300, 20, 200, 0, 0);
			obstacles.push(obstacle4);
		  
			var obstacle5 = new Obstacle(500, 0, 20, 200, 0, 400);
			obstacles.push(obstacle5);
		  
			var obstacle6 = new Obstacle(600, 300, 20, 200, 400, 0);
			obstacles.push(obstacle6);
		  
			var obstacle7 = new Obstacle(700, 0, 20, 200, 0, 400);
			obstacles.push(obstacle7);
			
			break;
			
			case 6:
			currentGameState=gameStates.win;
			
			break;
			
			}
		
		/*}*/
		
	}

    /*****************************/
    /* Positionnement du score */
    function displayScore() {
        ctx.save();
        ctx.fillStyle = 'gold';
        ctx.fillText("Level : " + currentLevel, 670, 30);
        ctx.fillText("Time : " + (currentLevelTime / 1000).toFixed(1), 670, 60);
        ctx.fillText("Missiles : " + nbBalls, 670, 90);
        ctx.restore();
    }
  
    
    function updatevesselPosition(delta) {
        vessel.speedX = vessel.speedY = 0;
        // check inputStates
        if (inputStates.left) {
            vessel.speedX = -vessel.speed;
        }
        if (inputStates.up) {
            vessel.speedY = -vessel.speed;
        }
        if (inputStates.right) {
            vessel.speedX = vessel.speed;
        }
        if (inputStates.down) {
            vessel.speedY = vessel.speed;
        }
        if (inputStates.space) {
        }
        if (inputStates.mousePos) {
        }
        if (inputStates.mousedown) {
            vessel.speed = 500;
        } else {
            // mouse up
            vessel.speed = 100;
        }

      // collision avec obstacles
      for(var i=0; i < obstacles.length; i++) {
        var o = obstacles[i];
          if(rectsOverlap(o.x, o.y, o.w, o.h, 
                          vessel.x, vessel.y, vessel.width, vessel.height)) {
             console.log("collision");
            //vessel.x = 10; // deplacer le monstre 
            //vessel.y = 10;
            vessel.speed = 30;//ralentir le monstre
           }
      }
        // Compute the incX and inY in pixels depending
        // on the time elasped since last redraw
        vessel.x += calcDistanceToMove(delta, vessel.speedX);
        vessel.y += calcDistanceToMove(delta, vessel.speedY);
    }



    function updateBalls(delta) {
        // Move and draw each ball, test collisions, 
        for (var i = 0; i < ballArray.length; i++) {
            var ball = ballArray[i];

            // 1) move the ball
            ball.move();

            // 2) test if the ball collides with a wall
            testCollisionWithWalls(ball);

            // Test if the vessel collides
            if (circRectsOverlap(vessel.x, vessel.y,
                    vessel.width, vessel.height,
                    ball.x, ball.y, ball.radius)) {

                //change the color of the ball
                ball.color = 'red';
                vessel.dead = true;
                // Here, a sound effect greatly improves
                // the experience!
                //plopSound.play();
            }

            // 3) draw the ball
            ball.draw();
        }
    }

    // Collisions between aligned rectangles
    function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
      
      if ((x1 > (x2 + w2)) || ((x1 + w1) < x2))
        return false; // No horizontal axis projection overlap
      if ((y1 > (y2 + h2)) || ((y1 + h1) < y2))
        return false; // No vertical axis projection overlap
      return true;    // If previous tests failed, then both axis projections
                      // overlap and the rectangles intersect
    }

    // Collisions between rectangle and circle
    function circRectsOverlap(x0, y0, w0, h0, cx, cy, r) {
        var testX = cx;
        var testY = cy;

        if (testX < x0)
            testX = x0;
        if (testX > (x0 + w0))
            testX = (x0 + w0);
        if (testY < y0)
            testY = y0;
        if (testY > (y0 + h0))
            testY = (y0 + h0);

        return (((cx - testX) * (cx - testX) + (cy - testY) * (cy - testY)) < r * r);
    }


    function testCollisionWithWalls(ball) {
        // left
        if (ball.x < ball.radius) {
            ball.x = ball.radius;
            ball.angle = -ball.angle + Math.PI;
        }
        // right
        if (ball.x > w - (ball.radius)) {
            ball.x = w - (ball.radius);
            ball.angle = -ball.angle + Math.PI;
        }
        // up
        if (ball.y < ball.radius) {
            ball.y = ball.radius;
            ball.angle = -ball.angle;
        }
        // down
        if (ball.y > h - (ball.radius)) {
            ball.y = h - (ball.radius);
            ball.angle = -ball.angle;
        }
    }

    function getMousePos(evt) {
        // necessary to take into account CSS boudaries
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function createBalls(numberOfBalls) {
        // Start from an empty array
        ballArray = [];

        for (var i = 0; i < numberOfBalls; i++) {
            // Create a ball with random position and speed. 
            // You can change the radius
            var ball = new Ball(w * Math.random(),
                    h * Math.random(),
                    (2 * Math.PI) * Math.random(),
                    (80 * Math.random()),
                    30);

            // Do not create a ball on the player. We augmented the ball radius 
            // to sure the ball is created far from the vessel. 
            if (!circRectsOverlap(vessel.x, vessel.y,
                    vessel.width, vessel.height,
                    ball.x, ball.y, ball.radius * 3)) {
                // Add it to the array
                ballArray[i] = ball;
            } else {
                i--;
            }


        }
    }
  
  
  /******************************************/
  /*Création des balles */
// constructor function for balls
    function Ball(x, y, angle, v, diameter) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.v = v;
        this.radius = diameter / 2;
        this.color = 'blue';

        this.draw = function () {
            ctx.save();
			/*
			var missile = new Image();
			missile.src = 'missiles.png';
		    ctx.drawImage(missile,this.x,this.y,30,30);
      
            ctx.fill();
			*/
			
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
            ctx.fill();
			
            ctx.restore();
            this.color = 'gold';// couleur balle
        };

        this.move = function () {
            // add horizontal increment to the x pos
            // add vertical increment to the y pos

            var incX = this.v * Math.cos(this.angle);
            var incY = this.v * Math.sin(this.angle);

            this.x += calcDistanceToMove(delta, incX);
            this.y += calcDistanceToMove(delta, incY);
        };
    }
  
  
  /********************************************/
  /*******************************************/
  /* Création des obstacles */
  function creerObstacles() {
        var obstacle1 = new Obstacle(100, 0, 20, 200, 0, 0);
        obstacles.push(obstacle1);
    
       var obstacle2 = new Obstacle(200, 300, 20, 200, 0, 0);
       obstacles.push(obstacle2);

      var obstacle3 = new Obstacle(300, 0, 20, 200, 0, 0);
      obstacles.push(obstacle3);

      var obstacle4 = new Obstacle(400, 300, 20, 200, 0, 0);
      obstacles.push(obstacle4);
	  
	  var obstacle5 = new Obstacle(500, 0, 20, 200, 0, 0);
      obstacles.push(obstacle5);
	  
	  var obstacle6 = new Obstacle(600, 300, 20, 200, 0, 0);
      obstacles.push(obstacle6);
	  
	  var obstacle7 = new Obstacle(700, 0, 20, 200, 0, 0);
      obstacles.push(obstacle7);
  }
// constructor function for balls
    function Obstacle(x, y, w, h, sx, sy) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.speedX = sx;
        this.speedY = sy;
        this.color = 'black';

        this.draw = function () {
            ctx.save();
			
			
            //ctx.fillRect(this.x, this.y, this.w, this.h);
            
			var meteorite = new Image();
			meteorite.src = 'meteorites.png';
			ctx.drawImage(meteorite,this.x,this.y,this.w,this.h);
			
			ctx.restore();
            //this.color = 'black';
        };

        this.move = function (delta) {
            // add horizontal increment to the x pos
            // add vertical increment to the y pos

            this.x += calcDistanceToMove(delta, this.speedX);
            this.y += calcDistanceToMove(delta, this.speedY);
        };
    }

    function loadAssets(callback) {
        // here we should load the souds, the sprite sheets etc.
        // then at the end call the callback function

        // simple example that loads a sound and then calls the callback. We used the howler.js WebAudio lib here.
        // Load sounds asynchronously using howler.js
        plopSound = new Howl({
            urls: ['http://mainline.i3s.unice.fr/mooc/plop.mp3'],
            autoplay: false,
            volume: 1,
            onload: function () {
                console.log("all sounds loaded");
                // We're done!
                callback();
            }
        });
    }
    var start = function () {
      
        document.getElementById("myCanvas").style.color="green";
      
        // adds a div for displaying the fps value
        fpsContainer = document.createElement('div');
        document.body.appendChild(fpsContainer);

        // Canvas, context etc.
        canvas = document.querySelector("#myCanvas");

        // often useful
        w = canvas.width;
        h = canvas.height;

        // important, we will draw with this object
        ctx = canvas.getContext('2d');
        // default police for text
        ctx.font = "20px Arial";      

        //add the listener to the main, window object, and update the states
        window.addEventListener('keydown', function (event) {
            if (event.keyCode === 37) {
                inputStates.left = true;
            } else if (event.keyCode === 38) {
                inputStates.up = true;
            } else if (event.keyCode === 39) {
                inputStates.right = true;
            } else if (event.keyCode === 40) {
                inputStates.down = true;
            } else if (event.keyCode === 32) {
                inputStates.space = true;
            }
        }, false);

        //if the key will be released, change the states object 
        window.addEventListener('keyup', function (event) {
            if (event.keyCode === 37) {
                inputStates.left = false;
            } else if (event.keyCode === 38) {
                inputStates.up = false;
            } else if (event.keyCode === 39) {
                inputStates.right = false;
            } else if (event.keyCode === 40) {
                inputStates.down = false;
            } else if (event.keyCode === 32) {
                inputStates.space = false;
            }
        }, false);

        // Mouse event listeners
        canvas.addEventListener('mousemove', function (evt) {
            inputStates.mousePos = getMousePos(evt);
        }, false);

        canvas.addEventListener('mousedown', function (evt) {
            inputStates.mousedown = true;
            inputStates.mouseButton = evt.button;
        }, false);

        canvas.addEventListener('mouseup', function (evt) {
            inputStates.mousedown = false;
        }, false);

        // We create tge balls: try to change the parameter
        //Création des balles 
        createBalls(nbBalls);

        //Création obstacle
        creerObstacles();
     
        // all assets (images, sounds) loaded, we can start the animation
        requestAnimationFrame(mainLoop);
        
    };

    //our GameFramework returns a public API visible from outside its scope
    return {
        start: start
    };
};


