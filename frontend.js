$(function () {
    // "use strict";

    /* Define Pub/Sub module */
    var events = (function(){
	var topics = {};
	var hOP = topics.hasOwnProperty;

	return {
	subscribe: function(topic, listener) {
	  // Create the topic's object if not yet created
	  if(!hOP.call(topics, topic)) topics[topic] = [];

	  // Add the listener to queue
	  var index = topics[topic].push(listener) -1;

	  // Provide handle back for removal of topic
	  return {
	    remove: function() {
	      delete topics[topic][index];
	    }
	  };
	},
	publish: function(topic, info) {
	  // If the topic doesn't exist, or there's no listeners in queue, just leave
	  if(!hOP.call(topics, topic)) return;

	  // Cycle through topics queue, fire!
	  topics[topic].forEach(function(item) {
	  		item(info != undefined ? info : {});
	  });
	}
	};
	})();

	////////////////////////////

    /* Web Socket */
    var count = $('#count');
    var input = $('#input');
    var status = $('#status');
    var riddle = $('#riddle');
    var riddleData = {};

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        count.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }

    // open connection
    // var connection = new WebSocket('ws://10.16.37.96:1337');

    // find port
    const PORT = window.location.port || '';
    // Heroku (uses wss because Heroku requires a secure connection)
    const URL = "wss://" + window.location.hostname + ':' + PORT;
    // localhost
    // const URL = 'ws://10.16.37.96:1337';
    // open connection
    var connection = new WebSocket(URL);

    connection.onopen = function () {
        input.removeAttr('disabled');
        status.text('Enter answer:');
    };

    connection.onerror = function (error) {
        // just in there were some problems with connection...
        status.html($('<p>', { text: 'Sorry, there\'s some problem with your '
                                    + 'connection or the server is down.' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
    
		if (json.type === 'count') { 
   		 	updateCount(json.data);
	 	} else if (json.type === 'color') { 
	 		$('#mobile, #feedback').css({
				'background-color': json.data
			});
			
	
   		} else if (json.type === 'newSphere') {
   			// waits 1 second, then removes instructions when new sphere is thrown
   			setTimeout(function(){
	   			$('.instructions').css({
					'opacity': '0'
				});
			}, 500);  
   		 	if (json.data.drop == false) updateCount(json.data.count);
   		 	addSphere(json.data);

   		} else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };

    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                                                 + 'with the WebSocket server.');
        }
    }, 3000);

    //////////////////////////

    /* Define Swipe Action */

	function detectswipe(el,func) {
	  var swipe_det = new Object();
	  swipe_det.sX = 0; swipe_det.sY = 0; swipe_det.eX = 0; swipe_det.eY = 0;
	  var min_x = 30;  //min x swipe for horizontal swipe
	  var max_x = 30;  //max x difference for vertical swipe
	  var min_y = 50;  //min y swipe for vertical swipe
	  var max_y = 60;  //max y difference for horizontal swipe
	  var direc = "";
	  var ele = document.querySelector(el);
	  ele.addEventListener('touchstart',function(e){
	    var t = e.touches[0];
	    swipe_det.sX = t.screenX; 
	    swipe_det.sY = t.screenY;
	  },false);
	  ele.addEventListener('touchmove',function(e){
	    e.preventDefault();
	    var t = e.touches[0];
	    swipe_det.eX = t.screenX; 
	    swipe_det.eY = t.screenY;    
	  },false);
	  ele.addEventListener('touchend',function(e){
	    //horizontal detection
	    if ((((swipe_det.eX - min_x > swipe_det.sX) || (swipe_det.eX + min_x < swipe_det.sX)) && ((swipe_det.eY < swipe_det.sY + max_y) && (swipe_det.sY > swipe_det.eY - max_y) && (swipe_det.eX > 0)))) {
	      if(swipe_det.eX > swipe_det.sX) direc = "r";
	      else direc = "l";
	    }
	    //vertical detection
	    else if ((((swipe_det.eY - min_y > swipe_det.sY) || (swipe_det.eY + min_y < swipe_det.sY)) && ((swipe_det.eX < swipe_det.sX + max_x) && (swipe_det.sX > swipe_det.eX - max_x) && (swipe_det.eY > 0)))) {
	      if(swipe_det.eY > swipe_det.sY) direc = "d";
	      else direc = "u";
	    }

	    if ((direc != "d") && (direc != "")) {
	      if(typeof func == 'function') func(el,direc);
	    }
	    direc = "";
	    swipe_det.sX = 0; swipe_det.sY = 0; swipe_det.eX = 0; swipe_det.eY = 0;
	  },false);  
	}

	detectswipe('#firework > .container', function(){
		// Prevents guide from being shown after first throw
		if (localStorage) {
			localStorage.removeGuide = JSON.stringify(true);
		};
		$('#hand').css('display', 'none');
		checkInput();

		// Throw firework image
		$('#firework > .container').animate({
			'top': '-25em'
		}, 1)
		setTimeout(function(){
			$('#firework > .container').css({
				'opacity': '0'
			});
		}, 500);
		setTimeout(function(){
			$('#firework > .container').css({
				'top': '100vh'
			});
			$('.overlay').css({
				'opacity': '0'
			});
		}, 1000);
		setTimeout(function(){
			$('#firework > .container').css({
				'opacity': '1',
				'top': '0'
			});
			$('.overlay, .feedback').css({
				'display': 'none'
			});
			
		}, 1500);

		// Scroll page to top
		$('html, body').animate({scrollTop: 0}, 500);

		$('#feedback').css({
			'transform': 'rotateX(0)'
		});
		setTimeout(function(){
			$('#feedback').css({
				'transform': 'rotateX(90deg)'
			});
		}, 1000);
	});

    /* Update count */
    function updateCount(c) {
        count.html('<p>'+ c +'</p>');
    }

	/* Check input against answer */
    function checkInput(el, dir){
    	var answer = input.val()
    		.toLowerCase()
    		.replace(/\s/g, '');
    	var riddleA = riddleData.answer
    		.toLowerCase()
    		.replace(/\s/g, '');
    	if (answer.includes(riddleA)){
    		connection.send(shape);

    		score++;
    		$('#score h2').text(score);
    		if (localStorage) {
				localStorage.score = JSON.stringify(score);
			};

			$('#feedback').text('RIGHT!');
            input.val('');
            getRiddle();
     
    	} else {
    		connection.send(false);
			console.log('the answer is wrong');
			status.text('Try again:');
			$('#feedback').text('Oops...');
		}
    }

    /* Get a new riddle */
    function getRiddle(){
		var xhr = $.ajax({
			type: 'GET',
			url: "https://laurawarr.ca/riddles.php",
			cache: false
		});

		xhr.done(function(data){
			riddleData = JSON.parse(xhr.responseText);

			// Adds riddle text to page
			riddle.text(riddleData.question);
			status.text('Enter answer:');
			// Fade loading overlay on load
			$('#overlay').addClass('fadeOut');
			
			setTimeout(function(){
				$('#overlay').css('display', 'none')
			},2000);

			$('#riddle, #status, #input, #firework').css({
    			'opacity': '1'
    		});
		});
	}
	getRiddle();

	/////////////////////

	/* THREE JS */

		// SCENE
		var scene, shape = null, score = 0;
		var container = document.getElementById('myCanvas');

		var heightMatch = window.matchMedia("(max-height: 800px)").matches;

		if (( Modernizr.touchevents ) && ( Modernizr.devicemotion && Modernizr.deviceorientation ) && (heightMatch)) {
			// Mobile device

			if (localStorage) {
				if (localStorage.shape) shape = JSON.parse(localStorage.shape);
				if (shape) assignActive(shape);

				if (localStorage.score) score = JSON.parse(localStorage.score);
				$('#score h2').text(score);

				if (localStorage.removeGuide){
					$('#hand').css('display', 'none');
				};

			}; //end if localStorage

			window.addEventListener('load', function(){
				// return page to top on reload
				$('html').animate({scrollTop:0}, 100);
	    		$('body').animate({scrollTop:0}, 100);
	    		
    		});

    		var statPos = status.offset();
    		var inputPos = input.offset();
    		var firePos = $('#firework').offset();
    		

    		window.addEventListener('keydown', function(e){
    			if (e.keyCode == 13){
    				input.blur();
    				var firework = firePos.top;
    				console.log($(document).height())
			  		$('html, body').animate({scrollTop: $(document).height()}, 500);
    			}
    		});

    		// focus on input when selected
		    $('#input').on('focus', function() {
			   var scroll = statPos.top;
			   $('html').animate({scrollTop: scroll}, 200);
			});

		    // Expand options on click
    		$('#options .active').on('mousedown', expandOptions);

    		// Close options on click
    		$('#options .close').on('mousedown', closeOptions);

    		// Re-assign shape when new shape selected
    		$('#options .button').on('mousedown', function(e){
    			var id = e.target.id;

    			// if button is inactive (and not the close button) change status to active
    			if (id && !$(this).hasClass("active") && !$(this).hasClass("close")){
	    			if (id == "heart" || id == "smile"){
	    				shape = id;
	    			} else if ( id == "explode"){
	    				shape = null;
	    			}

	    			// Remembers user's shape choice 
	    			if (localStorage) {
						localStorage.shape = JSON.stringify(shape);
					};
	
					// Remove event listeners from old active shape
					$('#options .active').off('mousedown', expandOptions);

	    			assignActive(id);

	    			// Add event listeners to new active shape
	    			$('#options .active').on('mousedown', expandOptions);

	    			closeOptions();
	    		};
    		});

    		function expandOptions(){
    			$('.button').css({
    				'opacity': '1',
    				'display': 'inline-block'
    			});
    			setTimeout(function(){
    				$('.button:nth-child(1)').css({
	    				'top': '-8em'
	    			});
	    			$('.button:nth-child(2)').css({
	    				'top':'-6.5em',
						'right':'3em'
	    			});
	    			$('.button:nth-child(3)').css({
	    				'right': '4.5em'
	    			});
    			}, 1);
    		};

    		function closeOptions(){
    			$('.button').css({
    				'top': '-3.5em',
    				'right': '0'
    			});
    			setTimeout(function(){
    				$('.inactive').css({
	    				'opacity': '0',
	    				'display': 'none'
	    			})
    			}, 500);
    		};

    		function assignActive(shape){
    			$('.active').addClass('inactive');
    			$('.active').removeClass('active');

    			$('#' + shape).addClass('active');
    			$('#' + shape).removeClass('inactive');
    		};
	


		} else {
		 	// Not mobile device, then create scene
			scene = new THREE.Scene();

			window.addEventListener('load', function(){
				$('.instructions *').css({
					'top': '0',
					'opacity': '1'
				});

				setTimeout(function(){
					$('.path').css({
						'stroke-dasharray': '0',
  						'stroke-dashoffset':'0'
					})
				}, 4500)
			});

			window.addEventListener('mousedown', function(){
				$('.instructions').css({
					'opacity': '0'
				});
			});
		};//
		
		// CAMERA
		var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
		var VIEW_ANGLE = 70, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 200000;
		var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

		scene.add(camera);
		camera.position.set(600,600, 600);
		camera.lookAt(scene.position);
		
		// RENDERER
		if (Detector.webgl)
			var renderer = new THREE.WebGLRenderer({antialias:true});
		else
			var renderer = new THREE.CanvasRenderer(); 

		renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
		container.appendChild(renderer.domElement);

		// EVENTS
		THREEx.WindowResize(renderer, camera);
		THREEx.FullScreen.bindKey({charCode : 'm'.charCodeAt(0)});

		// SKYBOX
		var skyBoxGeometry = new THREE.CubeGeometry(100000, 100000, 100000);
		var skyBoxMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side:THREE.BackSide});
		var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
		scene.add(skyBox);

		// CREATE SPHERES
		var particles = new THREE.Group();
		particles.name = "particles";
		scene.add(particles);

		var animateInGroup = new THREE.Group();
		animateInGroup.name = "animateInGroup";
		scene.add(animateInGroup);

		var rad = 500;

		//////////////////////

		/* Create a new sphere object */
	    function addSphere(obj){

	    	// GEOMETRY
			var circleGeo = new THREE.SphereGeometry( 5 , 32 , 32 ); 

			// MATERIAL
			var circleMat = new THREE.MeshBasicMaterial( {color: obj.color, transparent: true, opacity: 1} );

			// MESH
			var mesh = new THREE.Mesh( circleGeo, circleMat );

			// Push object to a group objects to be animated and store properties in array
			mesh.position.x = camera.position.x + 10;//610;
			mesh.position.z = camera.position.z;//600;
			mesh.position.y = camera.position.y - 10;//590;
			var temp = {
				'mesh': mesh,
				'end': obj.end,
				'moving': true,
				'elapsed': 0,
				'drop': obj.drop,
				'color': obj.color,
				'shape': obj.shape
			}
			animateIn.push(temp);
			animateInGroup.add(mesh);
	    }
		
		// LIGHT
		var light = new THREE.PointLight(0xffffff);
		light.position.set(100,250,100);
		scene.add(light);
		

		// ANIMATION	
		var counter = 0;
		var r;
		var animateIn = [];

		////////////////////////////

		/* Explode Animation */
		var movementSpeed = 30;
		var totalObjects = 200;
		var objectSize = 10;

		var parts = [];
		var s,t;

		var shapes = [null, null, "smile", "heart"];

		function ExplodeAnimation(x, y, z, color, num, sh){
		  var geometry = new THREE.Geometry();
		  var dirs = [];
		  if (num == null) num = totalObjects;

		  var rad = 1+Math.random()*5;
		  
		  for (var i = 0; i < num; i ++){ 
		    var vertex = new THREE.Vector3();
		    vertex.x = x;
		    vertex.y = y;
		    vertex.z = z;

		    s = 2*Math.PI*Math.random();
		    t = 2*Math.PI*Math.random();

		    var dirX, dirY, dirZ;

		    if (num == 1){
		    	dirX = x/100;
		    	dirY = -10;
		    	dirZ = z/100;

		    } else if (sh == "asteroid") {
		    	var asteroidX = Math.pow(Math.cos(s), 3);
				var asteroidY = Math.pow(Math.sin(s), 3);

				dirZ = -Math.abs(rad/5)*asteroidX;
				dirX = -Math.abs(rad/5)*asteroidY;
				dirY = 1;
				console.log("asteroid");

		    } else if (sh == "smile"){
		    	var smileyX = [2 * (Math.cos(s)), Math.cos(s/2), -1 + Math.cos(s)/10, 1 + Math.cos(s)/10];
				var smileyY = [2 * (Math.sin(s)), -Math.sin(s/2), 1 + Math.sin(s)/10, 1 + Math.sin(s)/10];

				var f = i%4;
				dirZ = -Math.abs(rad/2)*smileyX[f];
				dirX = -Math.abs(rad/2)*smileyY[f];
				dirY = 1;
				console.log("smile");

		    } else if (sh == "heart"){
		    	var heartZ = 16*Math.pow(Math.sin(s), 3);
				var heartX = 13*Math.cos(s) - 5*Math.cos(2*s) - 2*Math.cos(3*s) - Math.cos(4*s);

				dirZ = -heartZ/10;
				dirX = -heartX/10;
				dirY = 1;
				console.log("heart");

			} else if (sh == "star") {
				var starX = (2*Math.sin(3*s)*Math.cos(s));
				var starY = (2*Math.sin(3*s)*Math.sin(s));
				var starZ = Math.sin(3*s);

				dirZ = Math.abs(rad/5)*starX;
				dirX = Math.abs(rad/5)*starY;
				dirY = Math.abs(rad/5)*starZ;
				console.log("star");

			} else if (sh == "donut"){
				var R = rad/2;

				var donutX = Math.cos(s)*(rad + R*Math.cos(t));
				var donutY = Math.sin(s)*(rad + R*Math.cos(t));
				var donutZ = R*Math.sin(t);

				dirZ = -donutX/2;
				dirX = -donutY/2;
				dirY = donutZ/2;
				console.log("donut");

			} else {
		    	dirX = rad * Math.cos(t) * Math.sin(s);
		    	dirY = rad * Math.sin(t) * Math.sin(s);
		    	dirZ = rad * Math.cos(s);
		    }
			
	      	geometry.vertices.push( vertex );
		    dirs.push({
		    	x: dirX,
		    	y: dirY,
		    	z: dirZ
		    });
		  }

		  var material = new THREE.PointsMaterial( { size: objectSize,  color: color });
		  var particles = new THREE.Points( geometry, material );
		  
		  this.object = particles;
		  this.status = true;
		  
		  this.xDir = (Math.random() * movementSpeed)-(movementSpeed/2);
		  this.yDir = (Math.random() * movementSpeed)-(movementSpeed/2);
		  this.zDir = (Math.random() * movementSpeed)-(movementSpeed/2);
		  
		  scene.add( this.object  ); 

		  var that = this;
		  setTimeout(function(){
		  	scene.remove(that.object);
		  }, 15000)

		  var counter = 0;
		  
		  this.update = function(){
		  	counter += 0.01;
		    if (this.status === true){
		      var pCount = num;
		      while(pCount--) {
		        var particle =  this.object.geometry.vertices[pCount];
		        var velocity = 
		        particle.y += -0.98*counter*counter*Math.abs(dirs[pCount].y);
		        particle.x += dirs[pCount].x;
		        particle.z += dirs[pCount].z;
		      }
		      this.object.geometry.verticesNeedUpdate = true;
		      this.object.material.transparent = true;
		      this.object.material.opacity -= 0.001;

		    }
		  }
		}

		window.addEventListener( 'resize', onWindowResize, false );

		function onWindowResize() {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();

			renderer.setSize( window.innerWidth, window.innerHeight );
		}


		function animate() {

			var pCount = parts.length;
			while(pCount--) {
				parts[pCount].update();
			}

			// POSITION
			counter += 0.002;

			// ANIMATE TRAJECTORY ON ENTRY
			for (var i = 0; i < animateInGroup.children.length; i++){
				var speed = 20;
				var temp = animateIn[i];
				temp.elapsed += 0.01;
				
				var object = temp.mesh;
				var startX = object.position.x, startY = object.position.y, startZ = object.position.z;

				var endX = temp.end.x;
				var endY = temp.end.y;
				var endZ = temp.end.z;

				// On starting movement
				var distance = Math.sqrt(Math.pow(endX-startX,2)+Math.pow(endY-startY,2)+Math.pow(endZ-startZ,2));
				var directionX = (endX-startX) / distance;
				var directionY = (endY-startY) / distance;
				var directionZ = (endZ-startZ) / distance;
			
				// On update
				if(temp.moving == true){

				    object.position.x += directionX * speed * temp.elapsed;
				    object.position.y += directionY * speed * temp.elapsed;
				    object.position.z += directionZ * speed * temp.elapsed;

				   if (distance <= 10){
				   		
				        temp.moving = false;

				        if (temp.drop){
				   			parts.push(new ExplodeAnimation(endX, endY, endZ, temp.color, 1));
				   		} else {
							var m = Math.floor(Math.random()*shapes.length);
				   			parts.push(new ExplodeAnimation(endX, endY, endZ, temp.color, null, temp.shape));
				   		}
				      
				        animateInGroup.remove(object);
				        animateIn.splice(i, 1);

				    }
				}
			}

		    requestAnimationFrame(animate);
		 
			renderer.render(scene,camera);

		};

		animate();
	// }; //end touchevent
});