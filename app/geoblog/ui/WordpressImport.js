define([],
	function()
	{
		/**
		 * Wordpress Importer
		 * @class WordpressImport
		 *
		 * Class to import and manage blogpost from Wordpress
		 */

		return function WordpressImport(blogDomain)
		{

			var _posts = null;

			this.init = function() 
			{
				$.ajax({
					type: 'GET',
					url: 'https://public-api.wordpress.com/rest/v1/sites/' + blogDomain + '/posts/',
					dataType: "jsonp",
					success: function(data){
						if(data){
							_posts = data.posts;
							console.log(_posts);
							$("#blog").html(_posts[0].content);
						}
					}
				});
			}

		}

	}
);