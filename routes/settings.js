var user = require('../common/user-common');
var house = require('../common/house-common');

exports.view = function(req, res) {
  if ( user.isGuest(req) ) {
  	return res.redirect('/');
  }
  var myHouse = house.getHouseFromReq( req );
  var users = [];
  for (var i = 0; i < myHouse.users.length; ++i) {
    if ( i != req.cookies.userid ) {
      users.push( myHouse.users[i] )
    }
  }
  res.render('settings', {
   	'navbar': user.getNavbarData(req),
    'title': 'House Settings',
    'name': myHouse.name,
    'code': myHouse.code,
    'deal_day': myHouse.settings.deal_day,
    'deal_time': myHouse.settings.deal_time,
    'reroll_window': myHouse.settings.reroll_window,
    'users': users
  });
};

exports.update = function(req, res) {
  if ( user.isGuest(req) ) {
    return res.redirect('/');
  }
  var myHouse = house.getHouseFromReq( req );
  var users = [];
  for (var i = 0; i < myHouse.users.length; ++i) {
    if ( i != req.cookies.userid ) {
      users.push( myHouse.users[i] )
    }
  }

  myHouse.name = req.body.name;
  myHouse.settings.deal_day = req.body.deal_day;
  myHouse.settings.deal_time = req.body.deal_time;
  myHouse.settings.reroll_window = req.body.reroll_window;
  house.updateNextDealDate( myHouse );

  res.render('settings', {
    'navbar': user.getNavbarData(req),
    'title': 'House Settings',
    'name': myHouse.name,
    'code': myHouse.code,
    'deal_day': myHouse.settings.deal_day,
    'deal_time': myHouse.settings.deal_time,
    'reroll_window': myHouse.settings.reroll_window,
    'users': users,
    'alert': 'Settings saved!'
  })
};