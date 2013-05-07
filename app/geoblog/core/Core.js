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
				blog: null
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
				app.map.addLayer(app.blogLayer);

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
			app.blog = new BlogView(blogSelector,app.map,configOptions.cumulativeTime,"content","time","mapState",function(){
				if($("#blog").data("mCustomScrollbarIndex")){
					$("#blog").mCustomScrollbar("update");
				}
				else{
					$("#blog").mCustomScrollbar({
						theme: "dark-2",
						callbacks: {
							onScroll: selectPostByScrollPosition
						}
					});
					//Hide Loading animation
					$(".loader").fadeOut();
				}
				$(".blog-post-photo").load(function(){
					$("#blog").mCustomScrollbar("update");
				});

				app.blogData.setBlogElements($(".geoblog-post"));

				resizeBlogElements();
			});

			app.blogData.init(app.blogLayer,app.blog.update);

			//Add post editor
			if(isBuilder){
				require(["storymaps/geoblog/builder/BlogEditor"], function(BlogEditor){
					app.editor = new BlogEditor(blogSelector,app.map,function(blog,geo){
						var graphic,
							pt;
						
						if (geo){
							pt = geo;
						}
						else{
							pt = new esri.geometry.Point(0, 0);
						}

						graphic = new esri.Graphic(pt,null,blog);

						app.blogData.saveNewBlogPost(graphic,function(){;
							app.editor.discardEditor();
						});
					});
				});

				app.editor.init(function(){
					$("#blog").mCustomScrollbar("update");
					$("#blog").mCustomScrollbar("scrollTo","bottom");
				});
			}
		}

		function initializeApp(response)
		{			
			loadBlog();
			setupBanner(response.itemInfo.item.title,response.itemInfo.item.snippet);
		}

		function selectPostByScrollPosition(){
			var container = $("#blog .mCSB_container"),
				scrollTop = container.position().top,
				buffer = $("#blog").height() / 4,
				selectPosition = {
					top: null,
					bottom: null,
					fullyShown: null,
					topQuarter: null,
					bottomQuarter: null
				};

			if(scrollTop === 0){
				selectPosition.top = 0;	
			}
			else if(container.height() + scrollTop - (buffer*4) < 50){
				selectPosition.bottom = $(".geoblog-post").length - 1;
			}
			else{
				$(".geoblog-post").each(function(){
					if($(this).position().top + $(this).outerHeight() + scrollTop < $(blogSelector).height() && scrollTop + $(this).position().top >= 0){
						selectPosition.fullyShown = $(this).index();
					}
					else if(scrollTop + $(this).position().top <= buffer && scrollTop + $(this).position().top >= 0){
						selectPosition.topQuarter = $(this).index();
					}
					else if($(this).position().top + $(this).outerHeight() + scrollTop >= $(blogSelector).height() - buffer && $(this).position().top + $(this).outerHeight() + scrollTop < $(blogSelector).height()){
						selectPosition.bottomQuarter = $(this).index();
					}
				});
			}

			var postIndex = null;

			if(selectPosition.top !== null){
				postIndex = selectPosition.top;
			}
			else if(selectPosition.bottom !== null){
				postIndex = selectPosition.bottom;
			}
			else if(selectPosition.fullyShown !== null){
				postIndex = selectPosition.fullyShown;
			}
			else if(selectPosition.topQuarter !== null){
				postIndex = selectPosition.topQuarter;
			}
			else if(selectPosition.bottomQuarter !== null){
				postIndex = selectPosition.bottomQuarter;
			}

			if (postIndex !== null){
				app.blogData.setPostByIndex(postIndex,app.blog.selectPost);
			}
		}

		function resizeBlogElements()
		{
			//Set embedable content to fill width of blog with a 16:9 ratio
			$(".blog-post-embed-wrapper iframe").height($(".blog-post-embed-wrapper iframe").width() * 0.563);

			//$(".blog-post-photo").width($(".blog-post-embed-wrapper iframe").width() - 10);

			$("#blog").mCustomScrollbar("update");
		}

		return {
			init: init
		}
	}
);