# Mobile Schedule

## Overview

Use JSON to make a mobile schedule app that highlights events that are occuring now and allows browsing of events in the future. Best thing of all? - This doesn't require you to run any complicated server-side application such as Django or Rails - it is all done in client-side Javascript. Brought to you by some cool guys at CMU.[^1]

[^1]: [Kevin Burg](http://github.com/kevinburg), [Kevin Schaefer](http://kjschaef.com/), and [Alex Stern](http://alexstern.com)

- - - -
###### Current Status:  NOT COMPLETED
- - - -


## How to use

### Formatting the JSON

##### Format Key
DESCRIPTION (DATA TYPE) [KEY]

##### Format
* Event Name (string) [name] ex. 'CMU Orientation'
* Desktop Site URL (string) [desktop] ex. 'http://cmuorientation.com'
* Start Date (in ISO format) [startDate]
* End Date (in ISO format) [endDate]
* Twitter [twitter]
	* Use Twitter? (boolean) [use]
	* Twitter Handle (string) [handle] ex. 'jack'
* Events (array of event objects) [events]
	* Event	 
        * Unique ID (integer) [id]
		* Event Name (string) [name]
		* Event Description (string) [description]
		* Location Name (string) [location]
		* Longitude (float) [longitude] 
		* Latitide (float) [latitude]
		* Start Time (datetime) [startTime]
		* End Time (datetime) [endTime]
        * Important (boolean) [important]
		* Pre-Regisitration Required (boolean) [prereg]
* Static Pages (array of page objects) [staticPages]
	* Page
		* Name (string) [name]
		* Tab Bar Text (string) [tabBarText]
		* Sections (array of section objects) [sections]
			* Header (string) [header]
			* Body text (string/html) [body]
			
#### Example JSON
```
{
    "name": "CMU Orientation",
    "desktop": "http://springcarnival.org",
    "startDate": "2013-04-18T00:00:00.000Z",
    "endDate": "2013-04-21T00:00:00.000Z",
    "twitter": {
        "use": true,
        "handle": "cmuorientation"
    },
    "events": [
        {
            "id": 20,
            "name": "Sweepstakes Buggy Design Competition",
            "description": "View current Buggy designs and talk with the teams.",
            "location": "Wiegand Gym, University Center",
            "latitude": 40.443465,
            "longitude": -79.941604,
            "startTime": "2013-04-18T10:00:00.000Z",
            "endTime": "2013-04-18T14:00:00.000Z",
            "prereg": false
        },
        {
            "id": 3,
            "name": "Sweepstakes Buggy Design Competition",
            "description": "View current Buggy designs and talk with the teams.",
            "location": "Wiegand Gym, University Center",
            "latitude": 40.443465,
            "longitude": -79.941604,
            "startTime": "2013-04-18T10:00:00.000Z",
            "endTime": "2013-04-18T14:00:00.000Z",
            "prereg": false
        }
    ],
    "pages": [
        {
            "name": "Midway",
            "tabBarText": "Midway",
            "sections": [
                {
                    "header": "Midway Hours of Operation",
                    "body": "Thursday: 3 - 11 pm<br />Friday: 11am - 11pm"
                }
            ]
        }
    ]
}
```

#### Redirecting to mobile site
Add this code to the desktop version of your site and users will automatically be redirected to the mobile version with the choice to view the desktop site if they choose to.

```
	<script type="text/javascript">
		function getUrlVars() {
	    	var vars = {};
	    	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
	        	vars[key] = value;
	    	});
	    	return vars;
		}
		if (getUrlVars()["full"] != 'true' && screen.width <= 699) {
		    // modify this based on where your mobile site is hosted
			document.location = "mobile/entrance.html";
		}
	</script>

```




		 

