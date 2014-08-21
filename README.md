## License

This project is derived from a great work by `Cyrille Medard de Chardon` and `Geoffrey Caruso`.

Their project is at: http://geow.uni.lu/apps/fbr/index.html and is licensed under the MIT license.

This derived project is also licensed under the MIT license. See Licence.txt

## Introduction
The Massive Travel Time Request Tool (MassReq) uses the Bing Maps API to easily and simply gather route data for many origin-destination pairs. MassReq is designed with usability in mind so that errors do not interrupt processing and skipped records can easily be resubmitted for processing. Additionally the FBR output can easily be imported into GIS packages.

A simple origin-destination address or lat/long pair input will return:

* the lat/long of the origin,
* the lat/long of the destination,
* travel time in `seconds`, and
* travel distance in use `kilometers` or `miles`

## Prerequisite
* A server that you have access to. It could be your local machine, but you have to set up a `localhost` to use this tool.
* PHP is required to run this tool.
* You need to have a Bing Maps Key to make request to Microsoft's server. You can get one [here](https://www.bingmapsportal.com/).

## Installation
* Download the repo and upload to your server.
* Change the permission of `output` directory to 777 (writable for all).
* Insert your Bing Maps Key to 

## Usage
### Inserting your data
The data you wish to input should be formated in the following manner:

```
id;origin;destination
```

The formats of the origin and destination can be either a latitude and longitude seperated by a comma (49,-123) or an address string (vancouver, canada). Here are some example inputs:

```
1;London, UK;Cambridge, UK
2;43.5,7;Berlin, Germany
3;Paris, France;52.5,13.5
4;49,7;52.5,13.5
```

### Options
#### Explicitly indicate input type (lat/long versus address string)
Unlike the examples above it is suggested that all the input origin-destinations be in the same format (id;lat,long;lat,long or id;string;string etc...). Further, it is strongly recommended that you explicitly indicate in what format (lat/long or string) you are submitting the records. It has been noted that a lat/long submitted as a string can return slightly different results than when submitted as a lat/long numercial value. While FBR tries to determine your input format automatically if it believes you have made an error, its guess is not always correct.

#### Avoid highways/tollways/ferries
Allows you to avoid `highways` and/or `tollways`.

#### Travel types
You can select the type of travel you would like the distance/directions for. Available options are `DRIVING`, `TRANSIT` and `WALKING`. Note that transit directions are not widespread outside of North America. Using these travel types may return many or total retrieval errors due to no results being returned by the Bing Maps.

#### Pause time
This is the interval between direction requests to the Bing Maps API. Generally Bing Maps API has a rather high query quota for educational uses. If you are not sure whether your queries will exceed the allowed amount, check the Bing Maps API for reference. Additionally having too short a pause duration can increase your chance of rejection from the Bing Maps API server. There is a built-in delay of 600 milliseconds minimum. Combined with the default 400 millisecond option this creates a 1 second delay between requests.

#### Unit system used
You can select to use `kilometers` or `miles` for the output distance.

#### Output formatting
Before running MassReq you may choose a character to separate your output records. The default is `tab`. Select `comma` if you wish to create CSV data.

You can also choose to let the output file more readable by choosing `human-friendly` instead of using the default option `GIS-friendly`.

#### Stop/Pause processing
Once processing has commenced you may stop processing. Those records already processed in the input window will be removed leaving the remaining records. Pressing start again will create a new file.


## Example
**Input:**

```
1; O'hare International Airport; University of Illinois at Chicago
```

**Output:**

2014-08-18-17-19-34_maindata.txt contents:

```
1	41.9820986	-87.9021993	41.86918989999999	-87.6716525	1990	29635	10
```

2014-08-18-17-19-34_pathdata.txt contents:

```
1	1	41.9821	-87.90220000000001
1	2	41.98208	-87.90234000000001
1	3	41.98209000000001	-87.90239000000001
...
1	283	41.86925	-87.66733
1	284	41.869220000000006	-87.66939
1	285	41.86919	-87.67165000000001
```

## Screenshot
![](http://joysword.com/massreq/screenshot.png)