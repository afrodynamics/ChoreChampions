var user = require('../common/user-common');
var houses = require('../common/house-common');

exports.viewProject = function(req, res){
  if ( user.isGuest( req ) ) {
    return res.redirect('/');
  }
  res.render('store', {
    'title': 'Store',
    'navbar': user.getNavbarData(req),
    'inventory': [
      {
        'name': 'Re-Roll',
        'description': 'Trade in a chore for a chance to get another.',
        'price' : 250,
        'id' : 'reroll'
      },
      {
      	'name' : 'Week Off',
        'description': "Let the plebeians do it.",
      	'price' : 1500,
        'id' : 'weekoff'
      }
    ],
    'user': houses.getUser(req)
  });
};