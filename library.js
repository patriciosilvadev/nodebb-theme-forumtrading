'use strict';

var striptags = require.main.require('striptags');
var meta = require.main.require('./src/meta');
var user = require.main.require('./src/user');
var posts = require.main.require('./src/posts');
var db = require.main.require('./src/database');
var socket = require.main.require('./src/socket.io/plugins');

socket.cryptofrv2 = {};
socket.cryptofrv2.saveTheme = async function(socket, data, callback) {
	if (socket.uid === 0) {
		return;
	}
	await db.setObjectField(`user:${socket.uid}`, 'theme', data.theme);
	socket.emit('plugins.cryptofrv2.themeSaved', { theme: data.theme });
};

var library = {};

library.getUserFields = async function (data) {
	data.whitelist = [...data.whitelist, 'theme'];
	return data;
}


library.init = function(params, callback) {
	var app = params.router;
	var middleware = params.middleware;

	app.get('/admin/plugins/persona', middleware.admin.buildHeader, renderAdmin);
	app.get('/api/admin/plugins/persona', renderAdmin);

	const votePost = function (req, res) {
		var toPid = req.body.toPid,
		  isUpvote = JSON.parse(req.body.isUpvote),
		  uid = req.user ? req.user.uid : 0;
		const fn = isUpvote ? 'upvote' : 'unvote';
		posts[fn](toPid, uid, function (err, result) {
		  res.json({ error: err && err.message, result: result });
		});
	  };
	
	const downvotePost = function (req, res) {
		var toPid = req.body.toPid,
		  isDownvote = JSON.parse(req.body.isDownvote),
		  uid = req.user ? req.user.uid : 0;
		const fn = isDownvote ? 'downvote' : 'unvote';
		posts[fn](toPid, uid, function (err, result) {
		  res.json({ error: err && err.message, result: result });
		});
	  };

	console.log('registering routes');

	app.post('/cryptofrv2/vote', votePost);
	app.post('/cryptofrv2/downvote', downvotePost);

	callback();
};

library.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/plugins/persona',
		icon: 'fa-paint-brush',
		name: 'Persona Theme'
	});

	callback(null, header);
};

library.getTeasers = function(data, callback) {
	data.teasers.forEach(function(teaser) {
		if (teaser && teaser.content) {
			teaser.content = striptags(teaser.content, ['img']);
		}
	});
	callback(null, data);
};

library.defineWidgetAreas = function(areas, callback) {
	areas = areas.concat([
		{
			name: "Categories Sidebar",
			template: "categories.tpl",
			location: "sidebar"
		},
		{
			name: "Category Sidebar",
			template: "category.tpl",
			location: "sidebar"
		},
		{
			name: "Topic Sidebar",
			template: "topic.tpl",
			location: "sidebar"
		},
		{
			name: "Categories Header",
			template: "categories.tpl",
			location: "header"
		},
		{
			name: "Category Header",
			template: "category.tpl",
			location: "header"
		},
		{
			name: "Topic Header",
			template: "topic.tpl",
			location: "header"
		},
		{
			name: "Categories Footer",
			template: "categories.tpl",
			location: "footer"
		},
		{
			name: "Category Footer",
			template: "category.tpl",
			location: "footer"
		},
		{
			name: "Topic Footer",
			template: "topic.tpl",
			location: "footer"
		}
	]);

	callback(null, areas);
};

library.getThemeConfig = function(config, callback) {
	meta.settings.get('persona', function(err, settings) {
		config.hideSubCategories = settings.hideSubCategories === 'on';
		config.hideCategoryLastPost = settings.hideCategoryLastPost === 'on';
		config.enableQuickReply = settings.enableQuickReply === 'on';
		callback(null, config);
	});
};

function renderAdmin(req, res, next) {
	res.render('admin/plugins/persona', {});
}

library.addUserToTopic = function(data, callback) {
	if (data.req.user) {
		user.getUserData(data.req.user.uid, function(err, userdata) {
			if (err) {
				return callback(err);
			}

			data.templateData.loggedInUser = userdata;
			callback(null, data);
		});
	} else {
		data.templateData.loggedInUser =  {
			uid: 0,
			username: '[[global:guest]]',
			picture: user.getDefaultAvatar(),
			'icon:text': '?',
			'icon:bgColor': '#aaa',
		};
		callback(null, data);
	}
};

library.getCategoryHook = async function(data) {
	const topics = data.topics;
	const uid = data.uid;
	const promises = topics.map(async (topic) => {
		const hasVoted = await posts.hasVoted(topic.mainPid, uid);
		return {
			...topic,
			upvoted: hasVoted.upvoted,
			downvoted: hasVoted.downvoted,
			enableVoting: uid !== 0 && data.uid !== topic.uid
		}
	});
	data.topics = await Promise.all(promises);
	return data;
}

module.exports = library;
