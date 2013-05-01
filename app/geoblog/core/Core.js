define(["esri/map",
		"esri/arcgis/utils",
		"esri/layout",
		"esri/widgets",
		"storymaps/utils/Helper",
		"storymaps/geoblog/core/BlogData",
		"storymaps/geoblog/ui/BlogView",
		"dojo/has"],
	function(
		Map,
		Utils,
		Layout,
		Widgets,
		Helper,
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

		var isBuilder = false,
			blogSelector = "#blog";

		$(window).resize(function(){
			Helper.resetLayout();
			resizeBlogElements();
		});

		$(document).ready(function(){
			Helper.resetLayout();
			$(".loader").fadeIn();
		});

		function init()
		{
			app = {
				//Esri map variable
				map: null,
				//Feature services layer holding blog posts
				blogLayer: new esri.layers.FeatureLayer(configOptions.featureService),
				blogData: new BlogData(configOptions.reverseOrder),
				blog: new BlogView(blogSelector,"content",function(){
					resizeBlogElements();
					if($("#blog").data("mCustomScrollbarIndex")){
						$("#blog").mCustomScrollbar("update");
					}
					else{
						$("#blog").mCustomScrollbar({
							theme: "dark-2"
						});
					}
				})
			}

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

		function loadBlog()
		{
			app.blogData.init(app.blogLayer,app.blog.update);

			//Add post editor
			if(isBuilder){
				require(["storymaps/geoblog/builder/BlogEditor"], function(BlogEditor){
					app.editor = new BlogEditor(blogSelector,app.map,function(blog){
						var graphic,
							pt,
							geometry = $.parseJSON(blog.geometry);
						
						if (geometry){
							pt = new esri.geometry.Point({"x": geometry.x, "y": geometry.y," spatialReference": {" wkid": geometry.spatialReference.wkid }});
						}
						else{
							pt = new esri.geometry.Point(0, 0);
						}

						graphic = new esri.Graphic(pt,null,blog);
						console.log(graphic);

						app.blogData.saveNewBlogPost(graphic,function(){;
							app.editor.discardEditor();
						});
					});
				});

				app.editor.init();
			}
		}

		function initializeApp(response)
		{			
			loadBlog();
			setupBanner(response.itemInfo.item.title,response.itemInfo.item.snippet);
			$(".loader").fadeOut();
		}

		function resizeBlogElements()
		{
			//Set embedable content to fill width of blog with a 16:9 ratio
			$(".blog-post-embed-wrapper iframe").height($(".blog-post-embed-wrapper iframe").width() * 0.563);

			$(".blog-post-photo").width($(".blog-post-embed-wrapper iframe").width() - 10);
		}

		return {
			init: init
		}
	}
);