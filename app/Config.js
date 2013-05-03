define([],
	function ()
	{
		configOptions = {
			//The appid for the configured application
			appid: "",
			//The web map id
			webmap: "cffc475ae9d74d41aa21138c267ba9f5",
			//Enter the url to the feature service storing blog posts
			featureService: "http://services.arcgis.com/nzS0F0zdNLvs7nc8/ArcGIS/rest/services/geoblog/FeatureServer/0",
			//If starting blog from lastest post, set to true
			reverseOrder: false,
			//If true, time extent is cumulative to blog post date. If false, time extent is the state in time of blog post
			cumulativeTime: true,
			//Enter a title, if no title is specified, the webmap's title is used.
			title: "",
			//Enter a subtitle, if not specified the ArcGIS.com web map's summary is used
			subtitle: "",
			//If the webmap uses Bing Maps data, you will need to provided your Bing Maps Key
			bingmapskey: "Akt3ZoeZ089qyG3zWQZSWpwV3r864AHStal7Aon21-Fyxwq_KdydAH32LTwhieA8",
			// Specify a proxy for custom deployment
			proxyurl: "",
			//specify the url to a geometry service
			geometryserviceurl: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer",
			//Modify this to point to your sharing service URL if you are using the portal
			sharingurl: ""
		}
	}
);