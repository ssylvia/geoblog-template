define(["esri/map",
		"esri/arcgis/utils",
		"esri/layout",
		"esri/widgets",
		"storymaps/geoblog/core/BlogData",
		"storymaps/geoblog/ui/BlogView"],
	function(
		Map,
		Utils,
		Layout,
		Widgets,
		BlogData,
		BlogView)
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
				//Feature services layer holding blog posts
				blogLayer: new esri.layers.FeatureLayer(configOptions.featureService),
				blogData: new BlogData(configOptions.reverseOrder),
				blog: new BlogView()
			}

			//First layout setup called on app load
			resetLayout();

			if (!configOptions.sharingurl) {
				if(location.host.match("localhost") || location.host.match("storymaps.esri.com"))
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
					dojo.connect(map, "onLoad", function() {
						initializeApp(response);
					});
				}

			});
		}

		function loadBlog()
		{
			var queryTask = new esri.tasks.QueryTask(configOptions.featureService);

			var query = new esri.tasks.Query();
			query.outFields = ["*"];
			query.where = "blogPost != ''";
			query.returnGeometry = false;

			queryTask.execute(query,function(result){
				console.log(result);
				app.blogData.setBlogData(result.features,result.objectIdFieldName)
			});
		}

		function initializeApp(response)
		{
			buildBannerDisplay(response);
		}

		function buildBannerDisplay(response) 
		{
			$("#title").html(configOptions.title || response.itemInfo.item.title);
			$("#subtitle").html(configOptions.subtitle || response.itemInfo.item.snippet);
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