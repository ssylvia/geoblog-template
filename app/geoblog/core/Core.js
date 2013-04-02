define(["esri/map",
		"esri/arcgis/utils",
		"esri/layout",
		"esri/widgets",
		"storymaps/geoblog/ui/WordpressImport",
		"storymaps/geoblog/core/BlogData",
		"storymaps/geoblog/ui/BlogView",
		"dojo/has"],
	function(
		Map,
		Utils,
		Layout,
		Widgets,
		Wordpress,
		BlogData,
		BlogView,
		Has)
	{
		/**
		 * Core
		 * @class Core
		 *
		 * Geoblog viewer Main class
		 */

		//
		// Initialization
		//

		var isBuilder = false;

		$(window).resize(function(){
			resetLayout();
		});

		function init()
		{
			app = {
				//Esri map variable
				map: null,
				wordpressData: new Wordpress(getHostname(configOptions.blogURL),null,null,null,setupBanner),
				//Feature services layer holding blog posts
				//blogLayer: new esri.layers.FeatureLayer(configOptions.featureService),
				//blogData: new BlogData(configOptions.reverseOrder),
				blog: new BlogView("#inner-blog","title","content",function(){
					if(app.blogScroll){
						// $("img").load(function(){
						// 	app.blogScroll.refresh();
						// });
					}
				}),
				blogScroll: null
			}

			//First layout setup called on app load
			resetLayout();

			if (!configOptions.sharingurl) {
				if(location.host.match("localhost") || location.host.match("storymaps.esri.com") || location.host.match("c9.io"))
					configOptions.sharingurl = "http://www.arcgis.com/sharing/rest/content/items";
				else
					configOptions.sharingurl = location.protocol + '//' + location.host + "/sharing/content/items";
			}

			if (configOptions.geometryserviceurl && location.protocol === "https:")
				configOptions.geometryserviceurl = configOptions.geometryserviceurl.replace('http:', 'https:');

			esri.arcgis.utils.arcgisUrl = configOptions.sharingurl;
			esri.config.defaults.io.proxyUrl = configOptions.proxyurl;
			esri.config.defaults.geometryService = new esri.tasks.GeometryService(configOptions.geometryserviceurl);

			var urlObject = esri.urlToObject(document.location.href);
			urlObject.query = urlObject.query || {};

			if (urlObject.query.edit || urlObject.query.edit === "") {
				isBuilder = true;
			}

			loadMap();
			loadBlog();
		}

		function setupBanner(title,subtitle)
		{
			$("#title").html(configOptions.title || title);
			$("#subtitle").html(configOptions.subtitle || subtitle);
		}

		function loadMap()
		{
			var mapDeferred = esri.arcgis.utils.createMap(configOptions.webmap,"map",{
				mapOptions: {
					sliderPosition: "top-right"
				}
			});

			mapDeferred.addCallback(function(response){
				app.map = response.map;

				if (app.map.loaded){
					initializeApp(response);
				}
				else {
					dojo.connect(app.map, "onLoad", function() {
						initializeApp(response);
					});
				}

			});
		}

		function getHostname(url)
		{
			var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
			return url.match(re)[1].toString();
		}

		function loadBlog()
		{


			if(Has("ie") <= 8){
				//TODO: IE 7/8 Scrolling method
			}
			else{
				app.blogScroll = new iScroll("blog",{
					bounce: true
				});
			}

			app.wordpressData.init(function(){
				app.blog.init(app.wordpressData.getCurrentPosts());
			});

			// var queryTask = new esri.tasks.QueryTask(configOptions.featureService);

			// var query = new esri.tasks.Query();
			// query.outFields = ["*"];
			// query.where = "blogPost != ''";
			// query.returnGeometry = false;

			// queryTask.execute(query,function(result){
			// 	app.blogData.setBlogData(result.features,result.objectIdFieldName);

			// 	app.blog.init(app.blogData.getCurrentBlogSet());
			// });
		}

		function initializeApp(response)
		{
		}

		function resetLayout()
		{
			$(".region-center").each(function(){
				var x = 0;
				var y = 0;
				x = $(this).siblings(".region-left").outerWidth() + $(this).siblings(".region-right").outerWidth();
				y = $(this).siblings(".region-top").outerHeight() + $(this).siblings(".region-bottom").outerHeight();
				$(this).css({
					"height" : $(this).parent().outerHeight() - y,
					"width" : $(this).parent().outerWidth() - x
				});
			});
		}

		return {
			init: init
		}
	}
);