var user = require('../common/user-common');
var house = require('../common/house-common');

exports.view = function(req, res) {
  if ( user.isGuest(req) ) {
  	return res.redirect('/');
  }
  var myHouse = house.getHouseFromReq( req );
  res.render('addchore', {
   	'navbar': user.getNavbarData(req),
    'title': 'Add a Chore',
    'name': myHouse.name
  });
};

exports.update = function(req, res) {
  if ( user.isGuest(req) ) {
    return res.redirect('/');
  }

  house.createCard( req );

  res.render('allchores', {
    title: 'All Chores',
    withinRerollPeriod: house.withinRerollPeriod(req),
    navbar: user.getNavbarData(req),
    'alert': 'Successfully added chore ' + req.body.name + '!',
    'cards': house.getAllCards( req )
  });
};