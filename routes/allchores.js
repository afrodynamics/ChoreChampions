var house = require('../common/house-common');
var user = require('../common/user-common');

exports.viewProject = function(req, res) {
  if ( user.isGuest( req ) ) {
  	return res.redirect('/');
  }
  res.render('allchores', {
  	title: 'All Chores',
  	withinRerollPeriod: house.withinRerollPeriod(req),
  	navbar: user.getNavbarData(req),
  	'cards': house.getAllCards( req )
  });
};