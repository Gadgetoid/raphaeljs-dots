!window.Raphael && document.write('<script src="http://cdn.jsdelivr.net/raphael/2.1.0/raphael-min.js"><\/script>');

var GadgetoidDots = function(game_canvas) {

	function vector(px,py){
		return {x:px,y:py};
	};
	function show_score(){
		game.score.results.toFront();
	};
	function log_score(message){
		var log = game.score.log.attr('text');
		game.score.log.attr({text:
			message + "\n" + 
			text.you_scored + ' ' + game.score.total + "\n" + log});
	};
	function rgb(colour){
		return 'rgb(' + colour.join(',') + ')';
	};
	function rgba(colour,alpha){
		return 'rgba(' + colour.join(',') + ',' + alpha + ')';
	};
	function rgbl(colour,lightness){
		var lcolour = [0,0,0];
		for (var hue in colour) {
			lcolour[hue] = colour[hue];
			lcolour[hue] += lightness;
			if(lcolour[hue] > 255)
				lcolour[hue] = 255;
		}
		return 'rgb(' + lcolour.join(',') + ')';
	};
	function update_drag_path(){
		game.state.drag_path.attr({
			drag_path: [game.state.origin.x,game.state.origin.y,game.state.waypoints,game.state.drag.x,game.state.drag.y]
		});
	};
	function dot_mouseout(){
		var current_col = settings.colours[this.data('col')];
		this.animate({fill:rgb(current_col)},200);
	};
	function dot_mouseover(){
		var current_col = settings.colours[this.data('col')];
		this.animate({fill:rgbl(current_col,100)},200);
	};
	function animate_to_position(dot){

		x = dot.data('pos').x;
		y = dot.data('pos').y;
		game.map[x+':'+y] = dot;

		dot.data('ords').x = (dot.data('pos').x+1) * ((settings.dot_radius*2) + settings.dot_spacing) - settings.dot_radius;
		dot.data('ords').y = (dot.data('pos').y+1) * ((settings.dot_radius*2) + settings.dot_spacing) - settings.dot_radius;				

		dot.stop().animate({
			cx:dot.data('ords').x,
			cy:dot.data('ords').y
		},dot.data('delay'),'bounce');

	};
	function pause(){
		game.state.paused = true;
	};
	function unpause(){
		game.state.paused = false;
	};
	function end(message){		
		game.state.paused = true;

		clearInterval(game.score.timer);

		// Prevent clicks for two seconds
		setTimeout(unpause,2000);
		game.score.started = false;

		for(var dot in game.state.waypoints){
			game.state.waypoints[dot].attr({
				fill:rgb(settings.colours[game.state.waypoints[dot].data('col')])
			});
		}

		clear_drag_path();
		log_score(message);
		show_score();
	};
	function countdown(){
		if(game.state.paused)
			return;

		game.score.time_left -= 1;
		game.score.time.attr({text:game.score.time_left});
		if( game.score.time_left <= 0 ){
			end(text.time_up);
			game.events.timeout();
		}
	};
	function check_legal_moves(){

		var found = false;
		
		game.dots.forEach(function(dot,index){

			var colour = dot.data('col');

			var check_dots = check_positions(dot.data('pos'));

			while( element = check_dots.pop() ){
				if( element.data('col') == colour ){
					found = true;
					break;
				}
			}

		});

		if(!found){
			end(text.no_moves_left);
			game.events.lose();
		}

	};
	function dot_onstart(o_x,o_y){
		if(game.state.paused)
			return;

		if(!game.score.started){
			game.score.total = 0;
			game.score.started = true;
			game.score.time_left = settings.time;
			game.score.time.attr({text:game.score.time_left});
			game.score.timer = setInterval(countdown,1000);
		}

		game.state.origin = this.data('ords');
		game.state.origin.dot = this.data('pos');
		game.state.waypoints.push( this );
		game.state.colour = this.data('col');
	};
	function check_positions(position){
		
		// Build up an array of all valid moves to check
		var positions_to_check = [];

		if( settings.horizontal ){
			positions_to_check.push(vector(position.x-1,position.y));
			positions_to_check.push(vector(position.x+1,position.y));
		}
		if( settings.vertical ){
			positions_to_check.push(vector(position.x,position.y-1));
			positions_to_check.push(vector(position.x,position.y+1));
		}
		if( settings.diagonal ){
			positions_to_check.push(vector(position.x-1,position.y-1));
			positions_to_check.push(vector(position.x-1,position.y+1));
			positions_to_check.push(vector(position.x+1,position.y-1));
			positions_to_check.push(vector(position.x+1,position.y+1));
		}


		// Check to see if dots exist in valid move positions
		var check_dots = []

		for( position in positions_to_check )
		{
			if ((found_dot = dot_at_position(positions_to_check[position])) != false && game.state.waypoints.indexOf(found_dot) == -1){
				check_dots.push(found_dot);
			}
		}

		return check_dots;
	};
	function dot_onmove(d_x,d_y){
		if(game.state.paused)
			return;

		// Grab the cursor x and y positions
		d_x += game.state.origin.x
		d_y += game.state.origin.y
		game.state.drag = vector(d_x,d_y);

		// Get the last waypoint added
		var last_dot = game.state.waypoints[ game.state.waypoints.length-1 ];
		var last_position = last_dot.data('pos');

		var check_dots = check_positions(last_position);

		while( element = check_dots.pop() ){

			if(		
				   element.data('col') == game.state.colour 
				&& d_x > element.data('ords').x - settings.dot_radius - (settings.dot_spacing/3)
				&& d_x < element.data('ords').x + settings.dot_radius + (settings.dot_spacing/3)
				&& d_y > element.data('ords').y - settings.dot_radius - (settings.dot_spacing/3)
				&& d_y < element.data('ords').y + settings.dot_radius + (settings.dot_spacing/3) ){

					element.attr({
						fill:rgbl(settings.colours[element.data('col')],70)
					});
					game.state.waypoints.push( element );

					for(var dot in game.state.waypoints){
						game.state.waypoints[dot].stop().animate({
							fill:rgbl(settings.colours[game.state.waypoints[dot].data('col')],
								2*(game.state.waypoints.length*game.state.waypoints.length))
						},0);
					}
					check_dots = [];
					return true;

			}

		}

		update_drag_path();
	};
	function dot_onend(){
		if(game.state.paused)
			return;

		if( game.state.waypoints.length > 1 )
		{
			for(var dot in game.state.waypoints){
				game.score.stats.removed[game.state.waypoints[dot].data('col')] += 1;
				game.state.waypoints[dot].attr({
					fill:rgb(settings.colours[game.state.waypoints[dot].data('col')])
				});
				dot_remove(game.state.waypoints[dot]);
			}

			// Apply "gravity" to dots to fill gaps left by removals
			dots_update();

			game.score.total +=  game.state.waypoints.length*game.state.waypoints.length*game.state.waypoints.length;//Math.floor(Math.log(game.state.waypoints.length) * 10 * game.state.waypoints.length);

			game.score.stats.total_moves += 1;

			game.score.display.attr({text:game.score.total});

			var pending_count;

			if( game.state.dots_in_play <= 0 && (game.mode == 'puzzle' || game.mode == 'elimination') )
			{
				game.score.running_total += game.score.total;
				
				game.score.display_total.attr({text:game.score.running_total});

				game.events.win();

				end(text.cleared);
				settings.level++;

				if(settings.level >= game.levels.length)
				{
					settings.level = 0;
				}
				return false;
			}
			// Check remaining legal moves
			check_legal_moves();
		}
		// Call the custom user function
		game.events.move();

		// Clean up
		clear_drag_path();
	};
	function get_dot_index(dot){
		var check_dot = dot;
		var return_index = -1;
		game.dots.forEach(function(element,index){
			if(element==check_dot){
				return_index = index;
			}
		});
		return return_index;
	};
	function dot_at_position(vector){
		var found = false;

		found = game.map[vector.x+':'+vector.y];

		if( typeof(found) == 'object' && found !== null )
		{return found;}
		else
		{return false;}

	}
	function dots_update(){


		while( (x = game.state.columns_to_update.pop()) != null ){

			var recurse = false;

			for( y = settings.dots.y-2;y >= 0; y-- ){

				var current_dot = dot_at_position(vector(x,y));

				if( current_dot != false ){

					var dot_below = dot_at_position(vector(x,y+1));
					if(dot_below == false){

						pos = current_dot.data('pos');

						game.map[pos.x+':'+pos.y] = null;

						current_dot.data('pos').y += 1;
						current_dot.data({delay:1000});
						animate_to_position(current_dot);
						recurse = true;

					}

				}

			}

			if( settings.respawn ) {

				if( (current_dot = game.pending[x].pop()) != null ){

					current_dot.data('pos').y = 0;
					current_dot.data({delay:1000});

					// If elimination mode is enabled, colours with no pieces left on the board will not appear
					var colour_index = get_new_colour(game.eliminate);

					current_dot.attr({fill:rgb(settings.colours[colour_index])});
					current_dot.data({col:colour_index});

					animate_to_position(current_dot);

					game.state.dots_in_play++;

					recurse = true;

				}

			}

			if ( recurse )
				game.state.columns_to_update.push(x);

		}
	};
	function dot_remove(dot){

		x = dot.data('pos').x;
		y = dot.data('pos').y;
		game.map[x+':'+y] = null;
		game.state.dots_in_play--;

		game.colour_count[dot.data('col')] -= 1;

		game.pending[x].push(dot);

		dot.data('pos').y = -1;
		dot.data('ords').y = game.state.dot_start_y;

		if(game.state.columns_to_update.indexOf(dot.data('pos').x) == -1)
		{
			game.state.columns_to_update.push(dot.data('pos').x);
		}

		dot.attr({cy:game.state.dot_start_y});
		
	};
	function get_new_colour(obey_counts){
		var new_colour = -1;
		var max_attempts = settings.colours.length*2, attempt = 0;
		while (new_colour = -1 && attempt < max_attempts) {

			var colour_index = Math.floor(Math.random()*(settings.colours.length));
			if (game.colour_count[colour_index] > 0 || obey_counts == false) {
				game.colour_count[colour_index] += 1;
				new_colour = colour_index;
				return new_colour;
			}

			attempt++; // Hard avoid infinite looping

		}
		return get_new_colour(false);

	};
	function clear_drag_path(){
		game.state.waypoints = [];
		game.state.origin = vector(0,0);
		game.state.origin.dot = vector(0,0);
		game.state.drag = vector(0,0);
		game.state.colour = -1;
		update_drag_path();
	}

	/*
		Clear user input and drop in a fresh set of dots
	*/
	function reset(){

		game.state.dots_in_play = 0;
		clear_drag_path();

		for( var colour = 0; colour< settings.colours.length;colour++ )
		{
			game.colour_count[colour] = 0;
			game.score.stats.removed[colour] = 0;
		}


		game.dots.forEach(function(dot,index){

			x = dot.data('pos').x;
			y = dot.data('pos').y;
			game.map[x+':'+y] = null;

			game.pending[x].push(dot);

			dot.data('pos').y = -1;
			dot.data('ords').y = game.state.dot_start_y-10;
			dot.attr({cy:game.state.dot_start_y-10});


			//dot.data('pos').y = -1;
			//dot.data('ords').y = game.state.dot_start_y;
			//dot.attr({cy:game.state.dot_start_y});

		});
		var current_delay = 0;
		for( var x = 0;x < settings.dots.x;x++ )
		{
			for( var y = 0;y < settings.dots.y;y++ )
			{	
				dot = game.pending[x].pop();

				dot_x = x * ((settings.dot_radius*2) + settings.dot_spacing) + settings.dot_spacing + settings.dot_radius;
				dot_y = y * ((settings.dot_radius*2) + settings.dot_spacing) + settings.dot_spacing + settings.dot_radius;

				var colour_index = get_new_colour(false);//Math.floor(Math.random()*(settings.colours.length));
				//game.colour_count[colour_index] += 1;

				if( settings.use_levels )
				{
					colour_index = game.levels[settings.level].pieces[y][x] - 1;
					if(colour_index == -1)
					{
						continue;
					}
				}

				dot.data({
					col:colour_index,
					pos:vector(x,y),
					ords:vector(dot_x,dot_y),
					delay:0
				})
				.attr({
					fill:rgb(settings.colours[colour_index]),
					cx:dot_x,
					cy:game.state.dot_start_y
				});
				
				dot.animate({cy:game.state.dot_start_y},settings.initial_delay - (current_delay + x),function(){
					dot_y = this.data('ords').y;
					this.animate({cy:dot_y},1000,'bounce');
				});

				game.map[x+':'+y] = dot;

				game.state.dots_in_play++;

				current_delay += game.state.in_delay;
			}
		}
	};

	function clear(){
		game.state.started = false;

		if(game.paper)
			game.paper.clear();

		settings.colours 				= default_colours;

		settings.background 	= default_background;
		settings.path 			= default_path;
		settings.text 			= default_text;

		game.score = default_score;
		game.state = default_state;

		game.map = [];
		game.pending = [];
		game.colour_count = [];
		game.levels = [];
	};

	function begin(){
		if(game.state.paused || game.blocked)
			return;
		game.score.log.attr({text:'', 'font-size': 16});
		game.score.results.toBack();
		game.score.time.attr({text:'0'});
		game.score.display.attr({text:'0'});

		reset();
	};

	function setup(){
		if(game.state.started)
			return false;

    	game.state.started = true;

		if( !document.getElementById(settings.canvas) )
		{
			document.write('<div id="' + settings.canvas + '"></div>');
		}
		else
		{
			game.paper.clear();
		}

		Raphael.fn.roundedRectangle = function (x, y, w, h, r1, r2, r3, r4){
		  var array = [];
		  array = array.concat(["M",x,r1+y, "Q",x,y, x+r1,y]); //A
		  array = array.concat(["L",x+w-r2,y, "Q",x+w,y, x+w,y+r2]); //B
		  array = array.concat(["L",x+w,y+h-r3, "Q",x+w,y+h, x+w-r3,y+h]); //C
		  array = array.concat(["L",x+r4,y+h, "Q",x,y+h, x,y+h-r4, "Z"]); //D

		  return this.path(array);
		};

		game.state.dot_start_y = -settings.dot_radius-settings.dot_spacing;
		game.state.in_delay = settings.initial_delay / settings.dots.y / settings.dots.x;

		var game_roundness = settings.dot_radius + settings.dot_spacing + 5;

		// Figure out how big the game canvas should be based on dot size/spacing
		game_width = (
			(settings.dots.x * settings.dot_radius * 2) 
			+ (settings.dot_spacing * (settings.dots.x+1))
		);

		game_height = (
			(settings.dots.y * settings.dot_radius * 2)
			+ (settings.dot_spacing * (settings.dots.y+1))
		);

		// Create the Raphael element for the game
		game.paper = Raphael(document.getElementById(settings.canvas),game_width,game_height+50);

		game.paper.text(0,game_height+20,text.score).attr(
			{'text-anchor': 'start',
			'font-size':16});

		game.paper.text(0,game_height+40,text.total).attr(
			{'text-anchor': 'start',
			'font-size':16});

		game.score.display = game.paper.text(60,game_height+20,"0").attr(
			{'text-anchor': 'start',
			'font-size':16});

		game.score.display_total = game.paper.text(60,game_height+40,"0").attr(
			{'text-anchor': 'start',
			'font-size':16});

		game.score.time = game.paper.text(game_width,game_height+20,"0").attr(
		{'text-anchor': 'end',
		'font-size':16
		});

		game.paper.customAttributes.arc = function (xloc, yloc, value, total, R) {
		    var alpha = 360 / total * value,
		        a = (90 - alpha) * Math.PI / 180,
		        x = xloc + R * Math.cos(a),
		        y = yloc - R * Math.sin(a),
		        path;
		    if (total == value) {
		        path = [
		            ["M", xloc, yloc - R],
		            ["A", R, R, 0, 1, 1, xloc - 0.01, yloc - R]
		        ];
		    } else {
		        path = [
		            ["M", xloc, yloc - R],
		            ["A", R, R, 0, +(alpha > 180), 1, x, y]
		        ];
		    }
		    return {
		        path: path
		    };
		};

		// drag_path draws a path from o_x,o_y to e_x,e_y with array points as interim nodes
		game.paper.customAttributes.drag_path = function(o_x,o_y,points,e_x,e_y){

			if( points.length > 0 )
			{
				player_path = [];

				player_path.push(["m",points[0].data('ords').x,points[0].data('ords').y]);

				for(var point = 1;point < points.length;point++){
					player_path.push([points[point].data('ords').x,points[point].data('ords').y]);	
				}

				player_path.push([e_x,e_y]);

				return {path:player_path};
			}
			else
			{
				return {path:[['m',0,0],[0,0]]}
			}
		}


		game_bg = game.paper.roundedRectangle(0,0,game_width,game_height,game_roundness,game_roundness,game_roundness,game_roundness);
		game_bg.attr({fill:rgb(settings.background),stroke:'none'});

		game.paper.setStart();

		for( var x = 0;x < settings.dots.x;x++ )
		{
			game.pending[x] = [];
			for( var y = 0;y < settings.dots.y;y++ )
			{	
				game.paper.circle(0,game.state.dot_start_y,settings.dot_radius)
				.attr({
					fill:'#FFFFFF',
					stroke:'transparent', // Still triggers a drag event!
					'stroke-width':settings.dot_spacing
				})
				.data({
					col:-1,
					pos:vector(x,y),
					ords:vector(0,game.state.dot_start_y),
					delay:0
				});
			}
		}

		game.dots = game.paper.setFinish();

		var score_offset = settings.dot_spacing + settings.dot_radius;

		game.paper.setStart();

			game.score.score_results_bg = game.paper.roundedRectangle(0,0,game_width,game_height,game_roundness,game_roundness,game_roundness,game_roundness);
			game.score.score_results_bg.attr({fill:rgba(settings.background,0.8),stroke:'none'});

			game.score.log = game.paper.text(score_offset,game_height/2).attr({
				'text-anchor': 'start',
				'fill': rgb(settings.text),
				'font-size':12});


			if( game.mode == 'puzzle' ){
				game.score.log.attr({text:
					"Hello, you have " + settings.time + " seconds" + "\n" +
					"to clear the screen of dots." + "\n \n" +
					"Swipe across dots of the same colour" + "\n" +
					"to remove them from play." + "\n \n" +
					"Click to get started!" + "\n \n \n " +
					"pi.gadgetoid.com"
				});
			}
			else{
				game.score.log.attr({text:
					"Hello, you have " + settings.time + " seconds" + "\n" +
					"to clear as many dots as possible." + "\n \n" +
					"Swipe across dots of the same colour" + "\n" +
					"to remove them from play." + "\n \n" +
					"Click to get started!" + "\n \n \n " +
					"pi.gadgetoid.com"
				});
			}

		game.score.results = game.paper.setFinish();

		game.score.results.click(function(){
			begin();
		});

		game.score.results.drag(function(){},function(){
			begin();
		},function(){});

		game_bg.drag(
			function(){},
			function(){},
			function(){}
			);

		game.dots.drag(
			dot_onmove,
			dot_onstart,
			dot_onend);

		game.state.drag_cursor = game.paper.path().attr({stroke:rgb(settings.path),'stroke-width':3});
		game.state.drag_path = game.paper.path().attr({stroke:rgb(settings.path),'stroke-width':3});
		
		reset();
		
	};
	function hexToRgb(hex) {
	    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    return result ? {
	        r: parseInt(result[1], 16),
	        g: parseInt(result[2], 16),
	        b: parseInt(result[3], 16)
	    } : null;
	};

	var default_colours = [
				[0x2a,0xa1,0x98],
				[0xdc,0x32,0x2f],
				[0xd3,0x36,0x82],
				[0x6c,0x71,0xc4],
				[0x85,0x99,0x00]
			];

	var default_background = [0x07,0x36,0x42];
	var default_path = [0xEC,0xF0,0xF1];
	var default_text = [0xFF,0xFF,0xFF];

	var default_state = {
			started: false,
			origin: {x:0,y:0},
			waypoints: [],
			columns_to_update: [],
			paused: false,
			dots_in_play: 0
		};

	var default_score = {
			display: null,
			display_total: null,
			total: 0,
			running_total: 0,
			time_left: 0,
			running: false,
			stats: {
				total_moves: 0,
				removed: [],
			}
		};

	var default_settings = {
			canvas: game_canvas,
			dots: {x:7,y:7},
			dot_radius: 8,
			dot_spacing: 20,
			initial_delay: 1000,
			background: default_background,
			colours: default_colours,
			path: default_path,
			text: default_text,
			time: 90,
			diagonal: false,
			horizontal: true,
			vertical: true,
			eliminate: false,
			respawn: true,
			use_levels: false,
			level: 0
		};

	var default_events = {
			win: function(){},
			lose: function(){},
			move: function(){},
			timeout: function(){}
		};

	var game = {
		mode: 'default',
		map: [],
		pending: [],
		colour_count: [],
		score: default_score,
		state: default_state,
		levels: [],
		events: default_events
	};

	var settings = default_settings;

	var text = {
		score: "score:",
		total: "total:",
		cleared: 'Cleared!',
		no_moves_left: 'No moves left!',
		time_up: 'Time up!',
		you_scored: 'You scored:'
	};

    return {
    	/*
			Every public function should return
			"self" to allow chaining.
    	*/
    	on_move: function(method){
    		game.events.move = method;

    		return this;
    	},
    	on_win: function(method){
    		game.events.win = method;

    		return this;
    	},
    	on_lose: function(method){
    		game.events.lose = method;

    		return this;
    	},
    	on_timeout: function(method){
    		game.events.timeout = method;

    		return this;
    	},
    	set_dot_cols: function(colours){
    		if( game.state.started )
    			return this;

    		for( var colour in colours ){
    			if( colours[colour].length != 3 && colours[colour].indexOf('#') > -1 ){
    				colours[colour] = hexToRgb(colours[colour]);
    				colours[colour] = [colours[colour].r,colours[colour].g,colours[colour].b];
    			}
    		}

    		settings.colours = colours;

    		return this;
    	},
    	add_level: function(level_title, level_layout){
    		game.levels.push({
    			title: level_title,
    			pieces: level_layout
    		});

    		return this;
    	},
    	set_mode: function(mode){
    		game.mode = mode;
    		switch(mode){
    			case 'puzzle':
    				settings.use_levels = true;
    				settings.elimination = false;
    				settings.respawn = false;
    			break;
    			case 'elimination':
    				settings.use_levels = false;
    				settings.elimination = true;
    				settings.respawn = true;
    			break;
    			default:
    				settings.use_levels = false;
    				settings.elimination = false;
    			break;
    		}

    		return this;
    	},
    	set_bg_col: function(colour){
    		colour = hexToRgb(colour);
    		settings.background = [colour.r,colour.g,colour.b];

    		return this;
    	},
    	set_text_col: function(colour){
    		colour = hexToRgb(colour);
    		settings.text= [colour.r,colour.g,colour.b];

    		return this;
    	},
    	set_path_col: function(colour){
    		colour = hexToRgb(colour);
    		settings.path= [colour.r,colour.g,colour.b];

    		return this;
    	},
    	set_dot_size: function(radius,spacing){
    		if( game.state.started )
    			return this;

    		settings.dot_radius = radius;
    		settings.dot_spacing = spacing;

    		return this;
    	},
    	set_timeout: function(timeout){
    		settings.time = timeout;

    		return this;
    	},
    	set_game_size: function(dots_x,dots_y){
    		settings.dots.x = dots_x;
    		settings.dots.y = dots_y;

    		return this;
    	},
    	set_allowed_moves: function(horizontal,vertical,diagonal){

			settings.diagonal 		= diagonal;
			settings.horizontal 	= horizontal;
			settings.vertical 		= vertical;

    		return this;
    	},
    	pause: function(){pause();return this;},
    	unpause: function(){unpause();return this;},
    	restart: function(){
    		reset();

    		return this;
    	},
    	begin: function(){
			begin();

			return this;
    	},
    	setup: function(){
    		setup();

    		return this;
    	},
    	clear: function(){
    		clear();

    		return this;
    	},
    	end: function(message){
    		end(message);

    		return this;
    	},
    	get_state: function(){
    		return game;
    	}
    }

}; 