if(navigator.cookieEnabled != true) {
    alert("Cookies are not enabled. Please enable them and reload the page.");
    $("body").append("Cookies are not enabled. Please enable them and reload the page.");
}

var firstVisit = false;
eventData = null;
analyzedEventData = null;
dataVersion = 0;

Zepto(function($){
    var eventCache = localStorage.getItem("eventCache");
    var localVersion = localStorage.getItem("localVersion");
    var analyzedEventCache = localStorage.getItem("analyzedEventCache");

    $.ajax({
        url: "../mobile-schedule/version.json",
        dataType: "json",
        success: function(data) {
            dataVersion = data["version"];
            success();
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            console.log(textStatus, errorThrown);
        }
    });
        
    function success() {
        if (eventCache == null || localVersion == null || (localVersion != dataVersion)) {
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
            var dict = new buckets.Dictionary();
            dict.table = analyzedEventData["events"].table;
            dict.nElements = analyzedEventData["events"].nElements;
            analyzedEventData["events"] = dict;
            generateContent();
        }
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

/* Content genration functions */

function generateContent() {
    updateAppName(eventData.name);
    generateNavBar();
    generateExternalLink();
    $("#scheduleWrapper").toggle();
    switch (pageType()) {
    case "static":
        generateStatic();
        break;
    default:
        generateSchedule();
    }
}

function generateExternalLink() {
    if (eventData["desktop"] == "") {
        $("#externalLink").hide();
    }
    else {
        $("#externalLink").attr("onclick", 'if(confirm("Go to the full website?")){window.location = "'+
        eventData["desktop"] + '?full=true"}');
    }
}

function updateAppName(name) {
    document.title = name;
    $('.appName').html(name);
}

function updateNavStyling() {
    var color1 = eventData["color1"];
    var color2 = eventData["color2"];
    if (color1 != "") {
	if (color2 == "") {
	    color2 = color1;
	}
	var css = "<style>header{"+
	    "background: "+color1+";"
	"background: -moz-linear-gradient(top,  "+color1+" 0%, "+color2+" 100%);"+
	    "background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,"+color1+"), color-stop(100%,"+color2+"));"+
	    "background: -webkit-linear-gradient(top,  "+color1+" 0%,"+color2+" 100%);"+
	    "background: -o-linear-gradient(top,  "+color1+" 0%,"+color2+" 100%);"+
	    "background: -ms-linear-gradient(top,  "+color1+" 0%,"+color2+" 100%);"+
	    "background: linear-gradient(to bottom,  "+color1+" 0%,"+color2+" 100%);"+
	    "filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='"+color1+"', endColorstr='"+color2+"',GradientType=0 );"+
	    "}</style>";
	$('head').append(css);
    }
}

function generateStatic() {
    function findStaticById(matchId) {
        for (var i in analyzedEventData["static"]) {
            if (analyzedEventData["static"][i].id == matchId) {
                return analyzedEventData["static"][i];
            }
        }
    };
    var whichStatic = getUrlVars()["static"];
    var content = findStaticById(whichStatic);
    $.each(content.sections, function(index, value) {
    	$("#eventDetail").append(
            "<ul id='info'><li id='first'><strong>" + value.header + "</strong></li>" +
        	"<li id='last'>" + value.body + "</li></ul>"
        );
    });
}

function generateSchedule() {
    var requestedDay = getDateFromUrl();
    var events = analyzedEventData["events"].get(analyzedEventData["sortedKeys"][requestedDay]);
    generateEventList(events);
}

function generateNavBar() {
    updateNavStyling();
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    $.each(analyzedEventData["sortedKeys"], function(index, value) {
    	year = value[0] + 1900;
    	month = value[1] + 1;
    	day = value[2];
    	date = new Date(year + " " + month + " " + day);
        dayName = days[date.getDay()];
        active = "";
        if (getUrlVars()['date'] == index) {
            active = 'active';
        }
        $("#navInnerWrap").append(
            "<a href='index.html?date=" + index + "'>" +
                "<div id='" + index + "btn' class='navButton " + active + "'>" +
                "<p>" + dayName + "</p>" +
                "</div></a>"
        );
    });
    // Static navigator
    if(analyzedEventData["static"] == null ||
       analyzedEventData["static"].length == 0) {
    }
    else {
        var first = analyzedEventData["static"][0];
        var rest = analyzedEventData["static"].slice(
            1, analyzedEventData["static"].length);
        active = "";
        if (getUrlVars()['static'] == first.id) {
            active = 'active';
        }
        $("#navInnerWrap").append(
            "<a href='static.html?static=" + first.id  +  "'>" +
                "<div style='border-left:solid 2px grey;' id='btn' class='navButton " + active + "'>" +
                "<p>" + first.tabBarText + "</p>" +
                "</div> </a>"
        );
        active = "";
        $.each(rest, function(index, value) {
            if (getUrlVars()['static'] == value.id) {
        	active = 'active';
            }	
            $("#navInnerWrap").append(
                "<a href='static.html?static=" + value.id + "'>" +
                    "<div id = 'btn' class = 'navButton " + active + "'>" +
                    "<p>" + value.tabBarText + "</p>" +
                    "</div> </a>"
            );
            active = "";
        });
    }
}

function generateEventList(allEvents) {
    var items = [];
    var laterTodayDividerShown = false;
    var requestedDay = new Date(allEvents[0].startTime);

    var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday",
                   "Thursday", "Friday", "Saturday", "Sunday"];

    if (requestedDay.getDate() == (new Date().getDate())) {
	items.push("<section class='divider'>Happening Now</section>");
    } else { 
	items.push("<section class='divider'>Happening " + weekday[requestedDay.getDay()] + "</section>");
    }
    items.push("<ul>");

    var numEvents = allEvents.length;
    for (var i=0; i<numEvents; i++) {
	// Check if the event is for today and that it hasn't already occurred
	if (requestedDay.getDate() == (new Date().getDate())) { 
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
		if (allEvents[i]['prereg'] == true) {
		    items.push("<div class='importantIcon'><img src='img/ticket.png' height='22px' width='22px' /></div>​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​");
		}
		items.push("</li></a>");
	    }
	} else {
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
	    if (allEvents[i]['prereg'] == true) {
		items.push("<div class='importantIcon'><img src='img/ticket.png' height='22px' width='22px' /></div>​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​");
	    }
	    items.push("</li></a>");
	}
    }
    // }

    items.push("</ul>");
    $('#schedule').html(items.join(''));
    hideAddressBar();
}

function getEventDetail() {
    eventID = getUrlVars()["event"];
    data = null;

    eventCache = localStorage.getItem("eventCache");
    allEvents = JSON.parse(eventCache);
    allEvents = allEvents['events'];

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
/* End content generation functions */

/* Utility functions */

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

function getDate() {
    var d = new Date();
    return d.getDate();
}

function getDateFromUrl() {
    var date = getUrlVars()["date"];
    if (date == undefined) {
        for(var i in analyzedEventData["sortedKeys"]) {
            var value = analyzedEventData["sortedKeys"][i];
            var today = new Date();
    	    var year = value[0] + 1900;
    	    var month = value[1] + 1;
    	    var day = value[2] + 1;
    	    var date = new Date(year + " " + month + " " + day);
            if (today.valueOf() <= date.valueOf()) {
                return i;
                
            }
        }
        return 0;
    } 
    return date;
}

function pageType() {
    if (getUrlVars()["static"] != undefined) {
        return "static";
    }
    else {
        return "date";
    }
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

function replaceURLWithHTMLLinks(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    stepOne = text.replace(exp,"<a href='$1'>$1</a>"); 
    return stepOne.replace(/@[\d\D]+\b/g, '<a href="http://www.twitter.com/$&">$&</a>');
}
