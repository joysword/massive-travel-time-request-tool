//global variable
var MassReq = {};

MassReq.directionsManager = '';
MassReq.driving = true;
MassReq.transit = false;
MassReq.walking = false;
MassReq.playnice;
MassReq.query_status = '';
MassReq.error_count = 0;
MassReq.cur_ori;
MassReq.cur_des;

var prev_handler_succ = '';
var prev_handler_fail = '';

//output spacing character
var spacer = '\t';

MassReq.callback = function () {
	console.log('callback');
	MassReq.directionsManager = new Microsoft.Maps.Directions.DirectionsManager(MassReq.map);
}


//will be executed on load
MassReq.initialize = function () {
	console.log("start initializing");

    var latlng = new Microsoft.Maps.Location(41.87, -87.7);
    var myOptions = {
    	zoom: 10,
		center: latlng,
		mapTypeId: Microsoft.Maps.MapTypeId.a,
    	credentials: "AhIQmKe02INGV-2-gL9T8GHVsXVNtROo80KuCrwIo_T6aGA_zQfBhJ3HMXod1oDE",
    	showMapTypeSelector: false,
    	enableSearchLogo: false,
    	showDashboard: false,
    	showScalebar: false,
    	disableKeyboardInput: true,
    	width: 200,
    	height: 280
    };

    MassReq.map = new Microsoft.Maps.Map(document.getElementById("map_canvas"), myOptions);
	Microsoft.Maps.loadModule('Microsoft.Maps.Directions', { callback: MassReq.callback });
	
	//setup error handling
	if (window.location.protocol === 'file:') {
		$('#warn').html("ERROR: You MUST place MassReq on a server and access it through http protocol.<br>Your URL should look something like <em><strong>http://your.host.name/massreq/index.html</strong></em><br>While MassReq may display the paths, <strong>your results will not be saved</strong>.");
		$("#warn").show('fast');
	}
	console.log("finish initializing");
};
  
//counts the number of rows/records submited
MassReq.countRecords = function countRecords(data_update) {
	//console.log("start countRecords");
	MassReq.du_status = data_update;

	function updateTA() {
		var recs,
			line_array,
			errors_or_warnings = '',
			skipped_blank_lines = 0,
			line_counter = 0,
			semi_colon_check,
			index;

		//console.log("start updateTA");

		if (MassReq.du_status === true) {
			//Determine the length (number of lines) entered
			line_array = $("#journeylist").val().split('\n');
			recs = line_array.length;
			
			//go through each line and check for existence and correct syntax
			for (index in line_array) {
				if (line_array[index].length === 0) {
					skipped_blank_lines += 1;
				} else {
					//not a blank line so check validity
					semi_colon_check = line_array[index].match(/;/g);
					if ( semi_colon_check == null || semi_colon_check.length !== 2 ) {
						errors_or_warnings += "Line " + line_counter + " has incorrect semi-colon syntax. There should be two semi colons per line. Correct syntax is: id;origin;destination<br>";
					}
				}
				line_counter += 1;
			}
			
			$("#rec_count").html((recs - skipped_blank_lines) + " records entered");
			
			
			if (recs - skipped_blank_lines === 1) {
				$("#rec_count").html(recs - skipped_blank_lines + " record entered");
			}
			
			//Prepare and print error/warning messages regarding count or format of input
			if (recs > 50000) {
				errors_or_warnings += "Warning: The Bing Maps API has a <a href='https://developers.google.com/maps/documentation/directions/#Limits'>query limit</a> of 50,000 directions requests per 24 hour period.<br>";
			}
			
			if (errors_or_warnings) {
				$("#warn").html(errors_or_warnings);
				$("#warn").show('fast');
			} else {
				$("#warn").hide('fast');
			}
			setTimeout(updateTA, 500);
		}

		//console.log("finish updateTA");
	}
	updateTA();

	//console.log("finish countRecords");

};

//stops route calculations
MassReq.stopCalc = function () {
	$("#b_stop").hide();
	MassReq.query_status = false;
};

//user clicks 'submit' button to call this function
MassReq.calcRoute = function () {

	console.log("start calcRoute");

	//init vars
	var hwavoid,
		favoid,
		tavoid,
		unitsys,
		d = new Date();
		
	MassReq.error_count = 0

	//get the date to create a new output file with todays date-time stamp
	MassReq.outputFile = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '-' + ('0' + d.getHours()).slice(-2) + '-' + ('0' + d.getMinutes()).slice(-2) + '-' + ('0' + d.getSeconds()).slice(-2);

	console.log('file:'+MassReq.outputFile);

	MassReq.driving = false;
	MassReq.transit = false;
	MassReq.walking = false;

	//get the the type of travel the user desires
	if ($('input[name=type]:checked').val() === 'd') {
		MassReq.driving = true;
	}
	else if ($('input[name=type]:checked').val() === 't') {
		MassReq.transit = true;
	}
	else {
		MassReq.walking = true;
	}
	
	console.log("type:"+String(MassReq.driving)+String(MassReq.transit)+String(MassReq.walking));
	
	//get the status of the highway avoid checkbox
	hwavoid = document.getElementById('hwavoid').checked;
	tavoid = document.getElementById('tavoid').checked;

	//Get the selected unit system
	if($('input[name=unitsys]:checked').val() === 'm') {
		//unitsys = google.maps.UnitSystem.METRIC;
		unitsys = Microsoft.Maps.Directions.DistanceUnit.kilometers;
	} else {
		//unitsys = google.maps.UnitSystem.IMPERIAL;
		unitsys = Microsoft.Maps.Directions.DistanceUnit.miles;
	}

	console.log('avoid: '+hwavoid+' '+tavoid);
	
	//clear skipped records and errors fields and hide the error section
	$("#jdist").val('');
	$("#warn_error_msg").val('');
	$('.error_sec').hide('fast');
	
	//set status to true, this is used to stop processing if needed
	MassReq.query_status = true;
	$("#b_stop").show();	//show the button to stop process
	$("#prog_box").show();	//show the progress bar

	//Get format type of origin/destination: address || lat, long
	var origtypelatlong = $("#origtype")[0].checked;	//true, false value
	var desttypelatlong = $("#desttype")[0].checked;	//true, false value
	
	//Get the selected output separator
	if($('input[name=sepval]:checked').val() === 't') {
		spacer = '\t';
	} else {
		spacer = ',';
	}
	
	var tarea = $("#journeylist").val();	//get the input
	var journies = tarea.split('\n');		//split by line
	var orig, dest, journey;
	var dump = '';							//in case cancellation it catches all records and prints the remaining jobs to do
	playnice = 0;

	var ttl_journies = journies.length;		//number of records
	var i = 0;
	var num_journies = ttl_journies;
	var wait_time = 600 + parseInt(Math.abs(document.getElementById("waittime").value),10);
	var process_progress = 0

	var getDirection = function() {
		
		//if finished processing a route but the user terminated the job...
		if(playnice === 0 && MassReq.query_status === false) {
			//num_journies contains the number of records left to process
			while(num_journies--) {
				dump += journies[i++] + '\n';
			}
			$("#journeylist").val(dump);
			return;	//end the function call
		}
		
		//switch controls asynchronous behaviour of AJAX requests.
		//Process next result if previous finished (0), otherwise wait (1), stop if an error has occurred (2).
		switch(playnice) {
			case 0:
				//everything normal, ask for next record
				// num_journies is false when 0
				if (num_journies--) {
					//split the row based on semi-colons
					journey = journies[i++].split(';');
					
					var an_error = false;
					
					//determine the type of the origin, assume it is a number if not then it must be an address
					if(origtypelatlong && isNaN(journey[1].split(',')[0])) {
						//user indicated lat/long but text submitted rather than a number
						origtypelatlong = false;
						$("#warn").html("Warning: Origin format has been changed to String<br>");
						$("#warn").show('fast');
						$("#origtype").attr('checked', false);//unchecks the checkbox
						an_error = true;
					} else {
						//do nothing the user has indicated correctly the format
						//hide the warning message whether it is visible or not
						$("#warn").hide('fast');
					}
					
					//determine the type of the destination, assume it is a number if not then it must be an address
					if(desttypelatlong && isNaN(journey[2].split(',')[0])) {
						//failed a string was entered but a number expected
						desttypelatlong = false;
						
						//if we already had an error we must not overwrite message
						if(an_error) {
							$("#warn").html($("#warn").html() + "Warning: Destination format has been changed to String");
						} else {
							$("#warn").html("Warning: Destination format has been changed to String");
						}
						
						$("#warn").show('fast');
						$("#desttype").attr('checked', false);//unchecks the checkbox
					} else {
						//hide the warning message whether it is visible or not
						if(!an_error) {
							$("#warn").hide('fast');
						}
					}
					
					//give origin the appropriate value type
					if(origtypelatlong) {	//lat/long
						MassReq.cur_ori = journey[1].split(',');
						//orig = new google.maps.LatLng(orig[0], orig[1]);
						loc = new Microsoft.Maps.Location(MassReq.cur_ori[0], MassReq.cur_ori[1]);
						orig = new Microsoft.Maps.Directions.Waypoint({ location: loc });
					} else {
						MassReq.cur_ori = journey[1];
						orig = new Microsoft.Maps.Directions.Waypoint({ address: MassReq.cur_ori });
					}
					
					//give destination the appropriate value type
					if(desttypelatlong) {	// lat/long
						MassReq.cur_des = journey[2].split(',');
						//dest = new google.maps.LatLng(dest[0],dest[1]);
						loc = new Microsoft.Maps.Location(MassReq.cur_des[0], MassReq.cur_des[1]);
						dest = new Microsoft.Maps.Directions.Waypoint({ location: loc });
					} else {
						MassReq.cur_des = journey[2];
						dest = new Microsoft.Maps.Directions.Waypoint({ address: MassReq.cur_des });
					}
					
					//prepare request object
					//var request = {
					//	origin:orig,
					//	destination:dest,
					//	avoidHighways:hwavoid,
					//	avoidFerries:favoid,
					//	avoidTolls:tavoid,
					//	unitSystem:unitsys
					//};

					//clear out waypoints in previous request
					var wp = MassReq.directionsManager.getAllWaypoints();
					for (var k=wp.length-1;k>=0;k--) {
						MassReq.directionsManager.removeWaypoint(wp[k]);
					}
					MassReq.directionsManager.addWaypoint(orig);
					MassReq.directionsManager.addWaypoint(dest);
					var requestOptions = {
						distanceUnit:unitsys,
						routeDraggable: false,
						routeAvoidance: (hwavoid * Microsoft.Maps.Directions.RouteAvoidance.avoidLimitedAccessHighway) | (tavoid * Microsoft.Maps.Directions.RouteAvoidance.avoidToll)
					}

					//call the function that sends the request to Bing Maps
					if (MassReq.driving) {
						console.log('requesting driving');
						//request.travelMode = google.maps.DirectionsTravelMode['DRIVING'];
						requestOptions.routeMode = Microsoft.Maps.Directions.RouteMode.driving;
						console.log('requestOptions:');
						console.log(requestOptions);
						console.log('journey[0]:'+journey[0]);
						console.log('i:'+i);
						MassReq.sendRequest(requestOptions,journey[0],i,'DRIVING');
					}

					else if (MassReq.transit) {
						console.log('requesting transit');
						//request.travelMode = google.maps.DirectionsTravelMode['TRANSIT'];
						requestOptions.routeMode = Microsoft.Maps.Directions.RouteMode.transit;
						var depart = new Date(d.getFullYear(), d.getMonth(), d.getDay(), '7', '30', '00', '00');
						var option = {
							//departureTime: depart
							transitTime: depart
						};
						requestOptions.transitOptions = option;
						MassReq.sendRequest(requestOptions,journey[0],i,'TRANSIT');
					}

					else if (MassReq.walking) {
						console.log('requesting walking');
						//request.travelMode = google.maps.DirectionsTravelMode['WALKING'];
						requestOptions.routeMode = Microsoft.Maps.Directions.RouteMode.walking;
						MassReq.sendRequest(requestOptions,journey[0],i,'WALKING');
					}

					//update the progress bar
					process_progress = (ttl_journies - num_journies) * 100 / ttl_journies;
					$("#prog_bar_size").css("width", process_progress + "%");
					$("#prog_text").html("Process " + process_progress.toFixed(1) + "% completed")
					
					//Call this function (in which we are in now) again in a set amount of time
					setTimeout(getDirection, wait_time);
					
					//force wait until this record is complete
					playnice = 1;
				} else {
					//finished processing all records/journies, hide appropriate content.
					$("#cmpper").show();
					if ( MassReq.error_count > 0 ) {
						$("#cmpper").html("Processing completed but with " + MassReq.error_count + " retrieval errors.");
						$("#cmpper").css("background-color", "orange")
					} else {
						$("#cmpper").html("Processing completed without any retrieval errors.");
						$("#cmpper").css("background-color", "lightgreen")
					}
					
					// hide the progress bar
					setTimeout(function() { $("#prog_box").hide("slow"); }, 3000);
					
					//hide the stop button again
					$("#b_stop").hide();
				}
				break;
			case 1:
				//still waiting for results
				setTimeout(getDirection, wait_time);
				break;
			case 2:
				//error has occured stop
				document.getElementById('warn_error_msg').value += "Stopped data gathering due to error. Remove completed and problematic records from input and resume.\n";
				break;
		}
	}; //end of method function call

	//start the setTimeout loop
	getDirection();

	console.log("end calcRoute");

};//end of function calcRoute();

//Needs to be placed in a seperate function so that each sendRequest function object has different olat/olong data
MassReq.sendRequest = function (requestOptions, LLid, query_num, travelType) {
	var i, print_results;

	MassReq.directionsManager.setRequestOptions(requestOptions);

	if ( prev_handler_fail !== '') {
		Microsoft.Maps.Events.removeHandler(prev_handler_fail);
	}

	if ( prev_handler_succ !== '') {
		Microsoft.Maps.Events.removeHandler(prev_handler_succ);
	}

	prev_handler_fail = Microsoft.Maps.Events.addHandler(MassReq.directionsManager, 'directionsError', requestFail);

	prev_handler_succ = Microsoft.Maps.Events.addHandler(MassReq.directionsManager, 'directionsUpdated', requestSucc);

	MassReq.directionsManager.calculateDirections();

	function requestSucc(result) {
		//console.log('status:'+status);
		console.log('status: ok');
		
		theleg = result.route[0].routeLegs[0];

		//combine and format all the data into one string

		if ($('input[name=outputformat]:checked').val() === 'e') {
			print_results = 
				LLid + spacer +
				'(' + theleg.startWaypointLocation.latitude + spacer +
				theleg.startWaypointLocation.longitude + ')' + spacer +
				'(' + theleg.endWaypointLocation.latitude + spacer +
				theleg.endWaypointLocation.longitude + ')' + spacer +
				theleg.summary.time + '(s)' + spacer +
				theleg.summary.distance + spacer + travelType;
		} else {
			print_results = 
				LLid + spacer +
				theleg.startWaypointLocation.latitude + spacer +
				theleg.startWaypointLocation.longitude + spacer +
				theleg.endWaypointLocation.latitude + spacer +
				theleg.endWaypointLocation.longitude + spacer +
				theleg.summary.time + spacer +
				theleg.summary.distance;
		}

		console.log('print_results:'+print_results);

		//try to send results to file using jquery AJAX
		$.ajax({
			type: 'POST',
			url: 'write_bing_data.php',
			data: {results: print_results, file: MassReq.outputFile, type: 'main'}
		}).fail( function(request, status, error) {
				document.getElementById('warn_error_msg').value +=
					LLid + spacer + 'Failed search query number: ' +
					query_num + ' - An error occurred while trying to submit data to server! Message: ' +
					error + '\n';
					$("#warn").html('Error encountered see details in Errors section below.');
					$("#warn").show('fast');
			});//end of fail/error function
		
		//finished and got all data successfully (well from google, could still fail to write to local server)
		playnice = 0;	//0 continue processing, 1 wait and try again, 2 halt processing
	}

	function requestFail(e) {
		console.log('status: fail!!!')
		// count errors
		MassReq.error_count += 1
		
		playnice = 0;	//0 continue processing, 1 wait and try again, 2 halt processing
		var out_string = LLid + ';';

		if(isNaN(MassReq.cur_ori[0])) {
			out_string += MassReq.cur_ori + ';';
		}
		else {
			out_string +=  MassReq.cur_ori[0]+ ',' + MassReq.cur_ori[1] + ';';
		}

		if(isNaN(MassReq.cur_des[0])) {
			out_string += MassReq.cur_des + ';';
		}
		else {
			out_string +=  MassReq.cur_des[0]+ ',' + MassReq.cur_des[1] + '\n';
		}

		if ($('input[name=outputformat]:checked').val() === 'e') {
			print_results = 
				LLid + spacer +
				'Error message: ' + e.message + ' (code: ' + e.responseCode + ')';
		} else {
			print_results =
				LLid + spacer +
				'Error message: ' + e.message + ' (code: ' + e.responseCode + ')';
		}

		//clean the output string of parantheses
		out_string = out_string.replace(/[\)\(]/g, "")
		console.log(out_string)

		//write/append to the error text areas
		$('#jdist').val($('#jdist').val() + out_string);
		$('#warn_error_msg').val($('#warn_error_msg').val() + print_results + '\n');
		
		//show the error sections
		$('.error_sec').show('fast');

		$.ajax({
			type: 'POST',
			url: 'writeGMdata.php',
			data: {results: print_results, file: MassReq.outputFile, type: 'main'}
		})
	}
};