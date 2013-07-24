document.cookie = "TemporaryTestCookie=yes;";
if(document.cookie.indexOf("TemporaryTestCookie=") == -1) {
    alert("Cookies are not enabled. Please enable them and reload the page.");
    $("body").append("Cookies are not enabled. Please enable them and reload the page.");
}

var firstVisit = false;
eventData = null;
analyzedEventData = null;

Zepto(function($){
    var eventCache = localStorage.getItem("eventCache");
    var localVersion = localStorage.getItem("localVersion");
    var analyzedEventCache = localStorage.getItem("analyzedEventCache");
    
    if (eventCache == null || localVersion == null || (localVersion < dataVersion) || true) {
	console.log("No cache or old cache of events...pulling events from JSON.");
        $.ajax({
            url: "../mobile-schedule/test.json",
            dataType: "json",
            success: function(data) {
                eventData = data;
                eventCache = JSON.stringify(eventData);
	        localStorage.setItem("localVersion", dataVersion);
                localStorage.setItem("eventCache", eventCache);
                analyzeEventData();
                generateContent();
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.log(textStatus, errorThrown);
            }
        });
    }
    else {
        eventData = JSON.parse(eventCache);
        analyzedEventData = JSON.parse(analyzedEventCache);
        analyzedEventData.__proto__ = buckets.Dictionary.prototype;
        generateContent();
    }
});

function analyzeEventData() {
    analyzedEventData = JSON.parse(JSON.stringify(eventData));
    var events = eventData["events"];
    var dict = new buckets.Dictionary();
    var date;
    
    $.each(events, function(index, value) {
        date = new Date(value["startTime"]);
        year = date.getYear();
        month = date.getMonth();
        day = date.getDate();

        v = dict.get([year, month, day]);
        if (v == undefined) {
            dict.set([year, month, day], [value]);
        }
        else {
            dict.set([year, month, day], v.concat([value]));
        }
    });

    dict.forEach(function(key, value) {
        newValue = value.sort(function(obj) {
            date = new Date(obj["startTime"]);
            return date.getTime();
        });
        dict.set(key, newValue);
    });

    analyzedEventData["events"] = dict;

    var sortedKeys = analyzedEventData["events"].keys();
    sortedKeys.sort(function(obj1, obj2) {
        val1 = (obj1[0] * 12 * 31) + (obj1[1] * 31) + obj1[2];
        val2 = (obj2[0] * 12 * 31) + (obj2[1] * 31) + obj2[2];
        return (val1 - val2);
    });
    analyzedEventData["sortedKeys"] = sortedKeys;
    localStorage.setItem("analyzedEventCache", JSON.stringify(analyzedEventData));
}

function generateContent() {
    var page = null; //TODO
    switch (page) {
    case "details":
        generateDetails();
    case "static":
        generateStatic();
    default:
        generateSchedule();
    }
}

function generateDetails() {
    //TODO
}

function generateStatic() {
    //TODO
}

function generateSchedule() {
    var requestedDay = getDateFromUrl();
    console.log(requestedDay);
    //var requestedDay = 0;
       
    var events = analyzedEventData["events"].get(analyzedEventData["sortedKeys"][requestedDay]);

    console.log(analyzedEventData);
    console.log(events);

    $("#scheduleWrapper").toggle();

    generateNavBar();
    generateEventList(events);
}

function getDateFromUrl() {
    var date = getUrlVars()["date"];
    if (date == undefined) {
        return 0;
    } 
    return date;
}

function generateNavBar() {
    $.each(analyzedEventData["sortedKeys"], function(index, value) {
        day = value[2];
        $("#navInnerWrap").append(
            "<a href='?date=" + index + "'>" +
            "<div id='" + index + "btn' class='navButton'>" +
            "<p>" + day + "</p>" +
            "</div></a>"
        );
    });
}

function generateEventList(events) {
    //TODO: html magic
    $.each(events, function(index, value) {
        $("#schedule").append(
            "<p>" + value["name"] + "</p>"
        );
    });
}

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


// Dis be cray, we take some big a** numbas and turn dat into a MAP
function initializeMap(coordinates) {
    var lat = coordinates[0];
    var lng = coordinates[1];
    
    if (lat != 'void') {
	$('#map').html('<a href="http://maps.google.com/?q=' + lat + ',' + lng + '"><img src="http://maps.googleapis.com/maps/api/staticmap?center=' + lat + ',' + lng + '&zoom=18&size=596x360&key=AIzaSyBOHWYmTdh0jXf_Ss8iYltBzl1N4ZW4aDc&sensor=false&markers=color=0xBE102E|' + lat + ',' + lng + '" /></a>');
    } else {
	$('#map').remove();
    }
}

function getDate() {
    var d = new Date();
    return d.getDate();
}

// MAIN EVENT LIST PAGE
function getEvents() {
    var requestedDay = parseInt(getURLDate());
    
    // This line will be replaced because we will be dealing with a real date object.
    var dayOfWeek = getDayOfDate(requestedDay);
    
    // We need to make sure we make these buttons the same way as they are being toggled.
    $('#' + requestedDay + 'btn').toggleClass('active');

    // See this *items* var below? yeah? well its about get RULL serious up in here.
    var items = [];
    var laterTodayDividerShown = false;

    // If today is the day they want to see events for
    if (requestedDay == (new Date().getDate())) {
	// then we will show the section divider for what is going on right now.
	items.push("<section class='divider'>Happening Now</section>");
    } else { 
	items.push("<section class='divider'>Happening " + dayOfWeek + "</section>");
    }
    items.push("<ul>");


    // Burg, trust me, you don't want to read the next ~70 lines. But really, you don't need to. 
    // Just know this. We take allEvents and iterate over them to make the list view.
    var numEvents = allEvents.length;
    for (var i=0; i<numEvents; i++) {
	// Check if the event is for the requested day
	if (parseInt(new Date(allEvents[i].startTime).getDate()) == requestedDay) {
	    // Check if the event is for today and that it hasn't already occurred
	    if (requestedDay == (new Date().getDate())) { 
		if (new Date(allEvents[i].endTime) >= (new Date())) {
		    // Show the "Happening Later Today" divider if needed
		    if (new Date(allEvents[i].startTime) >= (new Date())) {
			if (laterTodayDividerShown == false) {
			    items.push("<section class='divider'>Happening Later</section>");
			    laterTodayDividerShown = true;
			}
		    }
		    items.push("<a href='detail.html?event=" + allEvents[i]['id'] + "'><li>");
		    items.push("<div class='info'><h3>" + allEvents[i]['name'] + "</h3>");
		    if (allEvents[i]['location'] != null) {
			items.push("<h4 class='location'>" + allEvents[i]['location'] + "</h4>");
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
	if (data == null && allEvents[i]['id'] == eventID.toString()) {
	    data = allEvents[i];
	    break;
	}
    }

    var items = [];
    
    items.push("<li id='first'>" + data['name'] + "</li>");
    items.push("<li>" + data['location'] + "</li>");
    items.push("<li>" + formatDate(new Date(data['startTime'])));

    if (data['endTime'] != "") {
	items.push(' - ' + formatDate(new Date(data['endTime'])));	
    }

    items.push('</li>');
    if (data['prereg']) {
	items.push("<li><img src='img/ticket.png' width='25' height='25' style='width:25px;height:25px;border-radius:none;-webkit-box-shadow:none;margin-right:10px;' /> Ticket or pre-registration required for this event.</li>");
    }

    items.push("<li id='last'>" + data['description'] + "</li>");
    $('#info').append(items.join(''));
    initializeMap([data['latitude'], data['longitude']]);
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
    var hh = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    var dd = "AM";
    var h = hh;
    if (h >= 12) {
        h = hh-12;
        dd = "PM";
    }
    else {
    	h = hh;
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

// So this requires some server to cache the latest tweet, which is what our Django install is doing.
// We can probably use this for this years orientationapp but I would like to find a way of doing this
// that doesn't require my server.
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
// KTHXBAI
