/**
 * Controller for adding/removing users to a House,
 * and manipulating House data.
 */

// TODO: Schema for this data is still TBD
var houses = require('../common/house-common');
var user   = require('../common/user-common');

exports.create = function(req, res) {
	if ( user.isGuest( req ) ) {
		houses.create(req);
		houses.addUserToHouse(req, res);
		return res;
	}
	return res.redirect('/mychores');
};

exports.join = function(req, res) {
	// Use req.query for GET requests, req.body for POST requests
	if ( user.isGuest( req ) ) {
		return houses.addUserToHouse(req, res);
	}
	else {
		return res.redirect('/mychores');
	}
};

exports.deal = function(req, res) {
	if ( user.isLoggedIn( req ) ) {
		houses.deal( req );
		return res.redirect('/mychores');
	}
	else {
		return res.redirect('/');
	}
};

exports.reroll = function(req, res) {
	if ( user.isLoggedIn(req) ) {
		houses.reroll(req);
		return res.redirect('/mychores');
	}
	else {
		return res.redirect('/');
	}
};

exports.buy = function(req, res) {
	var desiredItem = req.body.item;
	var price       = req.body.price; // LOL this is terrrrrrrible
	var userid      = req.body.userid;
	var user = houses.getUser( req );
	if ( userid == user.userid ) {
		if ( desiredItem == "Re-Roll" ) {
			user.rerolls++;
			user.gold -= price;
		}
		else if ( desiredItem == "Week Off" ) {
			user.weekoff = true;
			user.gold -= price;
		}
		else {
			console.log('Unknown: user attempted to buy item (' + item + ')');
		}
	}
};

exports.getUserData = function(req, res) {
	var house = houses.getHouseFromReq(req);
	if ( house !== null ) {
		return res.json(houses.getUser(req));
	}
	else {
		return res.json({});
	}
};