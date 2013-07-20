document.cookie = "TemporaryTestCookie=yes;";
if(document.cookie.indexOf("TemporaryTestCookie=") == -1) {
alert("Cookies are not enabled. Please enable them and reload the page.");
$('body').append('Cookies are not enabled. Please enable them and reload the page.');
}

var firstVisit = false;
allEvents = null;


Zepto(function($){
	firstVisit = localStorage.getItem('firstVisit');
	
	if (firstVisit !== null) {
		$('#scheduleWrapper').toggle();
	} else {
		$('#startScreenWrapper').toggle();
	}
	
  	$('#submit').bind('click', function(e) {
  		e.preventDefault();
  		var identity = $('#identity').val();
  		if (identity !== "NULL"){
	  		// Submit their form somewhere
			enterSite();
		}
	});

	function enterSite() {
		localStorage.setItem('firstVisit', false);
		localStorage.setItem('localVersion', dataVersion);
		$('#startScreenWrapper').toggle();
		$('#scheduleWrapper').toggle();
	}

	// Get event data from Parse
	
	eventCache = localStorage.getItem('eventCache');
	localVersion = localStorage.getItem('localVersion');
	if (localVersion === null) {localStorage.setItem('localVersion', 0);}

	if (eventCache == null || (localVersion < dataVersion)) {
		localStorage.setItem('localVersion', dataVersion);
		console.log("No cache or old cache of events...pulling events from Parse.")
		Parse.initialize("oMtNM5Ku8hihZ8WFzPFAWzpgAeS9fQvaIS1xqMNW", "Fb8LnmyHIhxYRyNyiVqTSnkZxeFxj3VDZNQSUeNa");

		var Event = Parse.Object.extend("Event");
		var query = new Parse.Query(Event);
		query.ascending("startTime");
		query.limit(1000);
		query.find({
		  success: function(results) {
		      allEvents = results;
		      localStorage.setItem('eventCache', JSON.stringify(allEvents));
		      allEvents = JSON.parse(JSON.stringify(allEvents));
		      if (page != 'midway' || page != 'booth') {
						getEvents();
		  		}
					else {console.log('midway or booth page')}
		  }
		});
	} else {
		allEvents = JSON.parse(eventCache);
		if(typeof page === 'undefined'){
	   		page = "details";
			}
		if (page != 'static') {
			getEvents();
		}
		else {
			document.getElementById("boothbtn").scrollIntoView();
			hideAddressBar();
		}
	}
});

function hideAddressBar() {
  if(!window.location.hash)
  {
      if(document.height < window.outerHeight)
      {
          document.body.style.height = (window.outerHeight + 50) + 'px';
      }

      setTimeout( function(){ window.scrollTo(0, 1); }, 50 );
  }
}

window.addEventListener("load", function(){ if(!window.pageYOffset){ hideAddressBar(); } } );
window.addEventListener("orientationchange", hideAddressBar );

function initializeMap(coordinates) {
	var lat = coordinates[0];
	var lng = coordinates[1];
	
	if (lat != 'void') {
		$('#map').html('<a href="http://maps.google.com/?q=' + lat + ',' + lng + '"><img src="http://maps.googleapis.com/maps/api/staticmap?center=' + lat + ',' + lng + '&zoom=18&size=596x360&key=AIzaSyBOHWYmTdh0jXf_Ss8iYltBzl1N4ZW4aDc&sensor=false&markers=color=0xBE102E|' + lat + ',' + lng + '" /></a>');
	} else {
		$('#map').remove();
	}
}

// Returns the value of the 'date' URL paramater
function getURLDate() {
	if (getUrlVars()['date'] == undefined) {return 18;} 
    return getUrlVars()["date"];
}

// Returns the day of the week of a date
function getDayOfDate(date) {
	switch(date) {
		case 18:
			return "Thursday";
		case 19:
			return "Friday";
		case 20:
			return "Saturday";
		case 21:
			return "Sunday";
		default:
			return "Thursday";
	}
}

function getDate() {
	var d = new Date();
	return d.getDate();
}


// MAIN EVENT LIST PAGE
function getEvents() {
	var requestedDay = parseInt(getURLDate());
	
	var dayOfWeek = getDayOfDate(requestedDay);
	
	$('#' + requestedDay + 'btn').toggleClass('active');

	var items = [];
	var laterTodayDividerShown = false;

	if (requestedDay == (new Date().getDate())) {
		items.push("<section class='divider'>Happening Now</section>");
	} else { 
		items.push("<section class='divider'>Happening " + dayOfWeek + "</section>");
	}
 	items.push("<ul>");

	var numEvents = allEvents.length;
	for (var i=0; i<numEvents; i++) {
		// Check if the event is for the requested day
		if (parseInt(new Date(allEvents[i].startTime).addHours(4).getDate()) == requestedDay) {
			// Check if the event is for today and that it hasn't already occurred
			if (requestedDay == (new Date().getDate())) { 
				if (new Date(allEvents[i].endTime).addHours(4) >= (new Date())) {
					// Show the "Happening Later Today" divider if needed
					if (new Date(allEvents[i].startTime).addHours(4) >= (new Date())) {
						if (laterTodayDividerShown == false) {
							items.push("<section class='divider'>Happening Later</section>");
							laterTodayDividerShown = true;
						}
					}
					items.push("<a href='detail.html?event=" + allEvents[i]['objectId'] + "'><li>");
			  		items.push("<div class='info'><h3>" + allEvents[i]['Name'] + "</h3>");
			  		if (allEvents[i]['locationName'] != null) {
			  			items.push("<h4 class='location'>" + allEvents[i]['locationName'] + "</h4>");
			  		} else {
			  			items.push("<h4 class='location'>See Details</h4>");
			  		}
			  		items.push("<h4 class='time'>" + formatDate(new Date(allEvents[i]['startTime']))); 
			  		if (allEvents[i]['endTime'] != "") {
			  			items.push(' - ' + formatDate(new Date(allEvents[i]['endTime'])) );
			  		}
			  		items.push("</h4></div>");
					items.push("<div class='detailArrow'><img src='img/disclosure.png' height='22px' width='22px' /></div>​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​");
					if (allEvents[i]['important'] == true) {
						items.push("<div class='importantIcon'><img src='img/important.png' height='22px' width='22px' /></div>​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​");
					}
					if (allEvents[i]['ticketRequired'] == true) {
						items.push("<div class='importantIcon'><img src='img/ticket.png' height='22px' width='22px' /></div>​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​");
					}
					items.push("</li></a>");
				}
			} else {
				items.push("<a href='detail.html?event=" + allEvents[i]['objectId'] + "'><li>");
		  		items.push("<div class='info'><h3>" + allEvents[i]['Name'] + "</h3>");
		  		if (allEvents[i]['locationName'] != null) {
		  			items.push("<h4 class='location'>" + allEvents[i]['locationName'] + "</h4>");
		  		} else {
		  			items.push("<h4 class='location'>See Details</h4>");
		  		}
		  		items.push("<h4 class='time'>" + formatDate(new Date(allEvents[i]['startTime']))); 
		  		if (allEvents[i]['endTime'] != "") {
		  			items.push(' - ' + formatDate(new Date(allEvents[i]['endTime'])) );
		  		}
		  		items.push("</h4></div>");
				items.push("<div class='detailArrow'><img src='img/disclosure.png' height='22px' width='22px' /></div>​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​");
				if (allEvents[i]['important'] == true) {
					items.push("<div class='importantIcon'><img src='img/important.png' height='22px' width='22px' /></div>​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​");
				}
				if (allEvents[i]['ticketRequired'] == true) {
					items.push("<div class='importantIcon'><img src='img/ticket.png' height='22px' width='22px' /></div>​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​");
				}
				items.push("</li></a>");
			}
		}
	}

	items.push("</ul>");
	$('#schedule').html(items.join(''));
	hideAddressBar();
}

// EVENT DETAIL PAGE
function getEventDetail() {
	eventID = getUrlVars()["event"];
	data = null;

	for (var i=0;i<allEvents.length;i++) {
		if (data == null && allEvents[i]['objectId'] == eventID.toString()) {
			data = allEvents[i];
			break;
		}
	}

	var items = [];
		
	items.push("<li id='first'>" + data['Name'] + "</li>");
	items.push("<li>" + data['locationName'] + "</li>");
	items.push("<li>" + formatDate(new Date(data['startTime'])));

	if (data['endTime'] != "") {
	 	items.push(' - ' + formatDate(new Date(data['endTime'])));	
	}

	items.push('</li>');
	if (data.ticketRequired) {
		items.push("<li><img src='img/ticket.png' width='25' height='25' style='width:25px;height:25px;border-radius:none;-webkit-box-shadow:none;margin-right:10px;' /> Ticket or pre-registration required for this event.</li>");
	}

	items.push("<li id='last'>" + data['Description'] + "</li>");
	$('#info').append(items.join(''));
	initializeMap([data['Latitude'], data['Longitude']]);
}

// grabs GET vars call by getUrlVars()['objectName']
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

// Converts 24 hour time to 12 hour
function formatDate(date) {
	date = date.toString();
    var d = new Date(date);
    // d.setHours(d.getHours()+4);
    var hh = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    var dd = "AM";
    var h = hh;
    if (h >= 12 - 4) {
        h = hh-12 + 4;
        dd = "PM";
    }
    else {
    	h = hh + 4;
    }
    if (h == 0) {
        h = 12;
    }
    m = m<10?"0"+m:m;
    s = s<10?"0"+s:s;

    var pattern = new RegExp("0?"+hh+":"+m+":"+s);
    var replacement = h+":"+m;
    replacement += " "+dd;    

    d = date.replace(pattern,replacement);
    return d.slice(15,24);
}

var liveApp = true;

function getLatestTweet() {
	var tweet = [];	
			
	$.getJSON('http://cmuorientation.com/twitter/',
		function(data) {
			tweet.push("<p>"+replaceURLWithHTMLLinks(data[0]['text'].toString())+"</p>");
			tweet.push('<a href="http://www.twitter.com/cmucarnival"><img width="136" height="20" src="img/twitter.png" /></a>');
			
			!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");
						
			$('#twitterTweet').append(tweet.join(''));
	});
				
}
function replaceURLWithHTMLLinks(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    stepOne = text.replace(exp,"<a href='$1'>$1</a>"); 
    return stepOne.replace(/@[\d\D]+\b/g, '<a href="http://www.twitter.com/$&">$&</a>');
}
Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
}