/**
 * this will eventually become the model for Houses.
 * It is used to populate house objects with users,
 * cards, etc.
 *
 *
 * NOTES:
 *
 *   Since houses now contain all the card data, we are
 * now using "cards.json" as seed data for houses. Cards
 * can be in any of the following 4 states:
 *
 *   'undealt'    Card belongs to the Dealer
 *   'dealt'      Card belongs to a user
 *   'pending'    Chore is pending verification, 
 *                not in anyone's hand
 *   'verified'   Chore has been verified and will return
 *                to the dealer on the next deal cycle.
 */

var DEFAULT_GOLD = 250;
var DEFAULT_REROLLS = 1;
var BOUNTY_INC = 10;
var DEFAULT_SETTINGS = {
	'free_rerolls_per_week': 1,
	'deal_day': 'Sunday',
	'deal_time': '8 am',
	'reroll_window': '15 min'
};
var MAX_CARD_NAME_LENGTH = 13;

var houseDB = require('../data/houses.json');
var cardData = require('../data/cards.json');
var shuffle = require('shuffle-array');

module.exports.create = create;
module.exports.addUserToHouse = addUserToHouse;
module.exports.getNewHouseCode = getNewHouseCode;
module.exports.getHouse = getHouse;
module.exports.getHouseFromReq = getHouseFromReq;

function getHouse( houseCode ) {
	for ( var i = 0; i < houseDB.houses.length; ++i ) {
		var tmp = houseDB.houses[i];
		if ( tmp.code == houseCode ) {
			return tmp;
		}
	}
	return null;
};

function getHouseFromReq( req ) {
	var code = req.cookies.code;
	return getHouse(code);
}

function create( req ) {
	// Search to see if the house exists. Creates a new house.
	var code = req.body.code || req.query.code || '';
	var beds = req.body.beds || req.query.beds || '';
	var name = req.body.houseName || req.query.houseName || 'Unamed House';
	var baths = req.body.baths || req.query.baths || '';
	var house = getHouse(code);
	if ( house === null ) {
		var newHouse = {
			code: code,
			name: name,
			last_deal: new Date(Date.now()),
			next_deal: null,
			users: [],
			bathrooms: beds,
			bedrooms: baths,
			settings: DEFAULT_SETTINGS,
			cards: cardData,
			rerolled_cards: []
		};
		updateNextDealDate(newHouse);
		houseDB.houses.push(newHouse);
	}
	else {
		// If the house already exists, just add this user to that house.
		throw "This house already exists!";
	}
}

function createCard( req ) {
	var house = getHouseFromReq(req);
	if ( house !== null ) {
		var card = {};

		card.id = house.cards.length;
		card.name = req.body.name;

		if ( card.name.length > MAX_CARD_NAME_LENGTH ) {
			card.name = card.name.slice(0,MAX_CARD_NAME_LENGTH);
		}

		card.reward = parseInt(req.body.reward);
		card.imageURL = req.body.imageURL || '/img/default.png';
		card.bounty = 0;  // Total accumulated bounty on card if it hasn't been completed in a while
		card.verifyBonus = 5;
		card.requirements = [];

		if ( req.body.req1 !== '' ) {
			card.requirements.push(req.body.req1);
		}
		if ( req.body.req2 !== '' ) {
			card.requirements.push(req.body.req2);
		}
		if ( req.body.req3 !== '' ) {
			card.requirements.push(req.body.req3);
		}

		card.belongsTo = ""; // Dealer
		card.belongsToName = "";
		card.state = "undealt";

		// Add new card to card list
		house.cards.cards.push(card);
	}
}
module.exports.createCard = createCard;

function reroll(req) {
	var house = getHouseFromReq(req);
	var user  = getUser(req);
	var cardId = req.body.id || '';
	if ( house !== null && user !== null ) {
		// Add the card to the rerolled_cards list in the house,
		// and keep track of who rerolled it.
		if ( user.rerolls > 0 ) {
			var card = getCard(req, cardId);
			card.belongsTo = ''; // Reset the owner of the card
			var rerollObj = {
				rerolledBy:  user.userid,
				card: card
			};
			user.rerolls--;
		}
	}
}
module.exports.reroll = reroll;

/**
 * After the end of the reroll period, all of the cards that
 * were rerolled are randomly distributed among the people
 * who rerolled.
 * @param  {House} house house object
 * @return {[type]}     [description]
 */
function dealFromRerolledCards(house) {
	if ( house !== null ) {
		
		// Keeps track of the total number of rerolls, by ID
		var rerollsPerUser = [];
		for ( var u = 0; u < house.rerolled_cards.length; ++u ) {
			var rerolledBy = house.rerolled_cards[u].rerolledBy;
			rerollsPerUser.push( rerolledBy );
		}
		shuffle(house.rerolled_cards);
		var cardIndex = 0;
		for ( var u = 0; 
			  cardIndex < house.rerolled_cards.length && u < usersWhoRerolled.length; 
			  ++u ) {
			var userid = rerollsPerUser[u];
			var card = getCard(req, house.rerolled_cards[cardIndex].id );
			card.belongsTo = userid;
			card.belongsToName = getUser(null, userid).name;
			cardIndex++;
		}

		// Clear the rerolled list
		house.rerolled_cards = [];
	}
}
module.exports.dealFromRerolledCards = dealFromRerolledCards;

/**
 * The dealer takes all the cards out from the verified
 * pile and from all of the users in the house and
 * redistributes them as equally as possible.
 * @param  {[type]} req HTTP request
 * @return {[type]}     [description]
 */
function deal(req) {
	var house = getHouseFromReq(req);
	console.log(house);
	if ( house !== null ) {
		console.log('Cards are being dealt!');
		if ( house.users.length > 0 ) {
			// Fisher-Yates shuffle, thanks to internet
			shuffle(house.cards.cards);
			var userIndex = 0;
			var cardList = house.cards.cards;
			var freeRolls = house.settings.free_rerolls_per_week;
			var allUsersHaveWeekoff = true;

			// Give users their free re-rolls per week.
			for ( var u = 0; u < house.users.length; ++u ) {
				house.users[u].rerolls += freeRolls;
				allUsersHaveWeekoff = house.users[u].weekoff && allUsersHaveWeekoff
			}

			if ( allUsersHaveWeekoff === false ) {
				for ( var cardIndex = 0; cardIndex < cardList.length; ++cardIndex ) {
					
					var user = house.users[userIndex];
					while ( user.weekoff === true ) {
						// If the user has the week off of chores, then skip giving them a card
						userIndex = (userIndex + 1) % house.users.length;
						user = house.users[userIndex];
					}

					// If the current card wasn't verified last week,
					// we should increase its bounty. Otherwise, it 
					// should be reset
					var card = cardList[cardIndex];

					if ( card.status == 'verified' ) {
						card.bounty = 0;
					}
					else {
						card.bount += BOUNTY_INC;
					}

					card.status = 'dealt';
					card.belongsTo = user.userid;
					card.belongsToName = user.name;

					// Increment user index and wrap around if it's too big
					userIndex = (userIndex + 1) % house.users.length;
				}
			}

			// Calculate the time for the next deal
			var now = Date.now();
			house.last_deal = new Date(now);

			// Reset the weekoff boolean flag.
			for ( var u = 0; u < house.users.length; ++u ) {
				house.users[u].weekoff = false;
			}

			// Round off the time, update the next
			updateNextDealDate(house);
		}
	}
}
module.exports.deal = deal;

/**
 * Returns the list of all the users in this house.
 */
function getUsers(req) {
	var house = getHouseFromReq(req);
	if ( house !== null ) {
		return house.users;
	}
}
module.exports.getUsers = getUsers;

/**
 * Returns the user object specified by 'id'. If id is not
 * specified, it will return the user who is making this HTTP request.
 */
function getUser(req, id) {
	var userid = id || req.cookies.userid;
	var house = getHouseFromReq(req);
	if ( house !== null ) {
		var users = house.users;
		for ( var i = 0; i < users.length; ++i ) {
			if ( users[i].userid == userid ) {
				return users[i];
			}  
		}
	}
	return null;
}
module.exports.getUser = getUser;

/**
 * Gets a card by it's id.
 */
function getCard(req, cardId) {
	var cardList = getAllCards(req).cards;
	console.log(cardList);
	for ( var c = 0; c < cardList.length; ++c ) {
		if ( cardList[c].id == cardId ) {
			return cardList[c];
		}
	}
}
module.exports.getCard = getCard;

function getAllPending(req) {
	var cardList = getAllCards(req).cards;
	var retList = [];
	for ( var c = 0; c < cardList.length; ++c ) {
		if ( cardList[c].status == 'pending' ) {
			retList.push(cardList[c]);
		}
	}
	return retList;
}
module.exports.getAllPending = getAllPending;

function getAllCompleted(req) {
	var cardList = getAllCards(req).cards;
	var retList = [];
	for ( var c = 0; c < cardList.length; ++c ) {
		if ( cardList[c].status == 'verified' ) {
			retList.push(cardList[c]);
		}
	}
	return retList;
}
module.exports.getAllCompleted = getAllCompleted;

/**
 * Adds a user to the requested house. Returns an HTTP response.
 * Can either be success (redirects to home page) or returns to
 * the landing page with an error string.
 * @param {[type]} req HTTP request
 * @param {[type]} res HTTP response
 */
function addUserToHouse(req, res) {
	
	// Adds the requested user to the house, and logs him/her in
	// via cookie. If the house does not exist, then we are redirected
	// back to the
	var code  = req.query.code || req.body.code  || '';
	var name = req.query.name  || req.body.name  || '';
	var userid = -1;

	console.log('Adding a new user to house: ' + code);

	try {
		var houseData = getHouse(code);
		userid = houseData.users.length;
		houseData.users.push({
			name: name,
			userid: userid,
			gold: DEFAULT_GOLD,
			rerolls: DEFAULT_REROLLS,
			weekoff: false,
			chores_completed: 0,
			chores_approved: 0,
			chores_rejected: 0
		});
	}
	catch (e) {
		return res.render('landing', {
			'error': "A house with the given code does not exist.",
			'randomHouseCode': getNewHouseCode()
		});
	}

	res.cookie('code', code );
	res.cookie('name', name );
	res.cookie('userid', userid);

	// Whenever a user joins the house, we should re-deal all of the chores
	// but preserve those who had a week off.
	var users = getHouse(code).users;
	var weekoffs = [];
	
	for ( var i = 0; i < users.length; ++i ) {
		weekoffs.push(users[i].weekoff);
	}
	req.cookies.code = code; // hack: allows deal function to detect the proper house
	deal(req);
	for ( var i = 0; i < users.length; ++i ) {
		users[i].weekoff = weekoffs[i];
	}

	return res.redirect('/mychores');
}

/**
 * Returns all of the cards for this house as a list.
 * @param  {[type]} req HTTP request
 * @return {list}     list of Card objects
 */
function getAllCards( req ) {
	var house = getHouseFromReq( req );
	if ( house !== null ) {
		return house.cards;
	}
}
module.exports.getAllCards = getAllCards;

/**
 * Returns a random house code string. Doesn't affect DB.
 * @return {string} house code
 */
function getNewHouseCode() {
	var strlen = 6;
	var validChars = [
	'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 
	'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 
	's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', 
	'1', '2', '3', '4', '5', '6', '7', '8', '9' ];

	// TODO: Let database do this. This is obviously a race condition
	var houseCode = "";
	do {
		houseCode = "";
		for (var i = 0; i < strlen; ++i ) {
			var letter = Math.floor(Math.random() * validChars.length) % (validChars.length);
			houseCode += validChars[letter];
		}
	} while ( getHouse(houseCode) !== null );
	console.log('Generated Random House Code: ' + houseCode);
	return houseCode;
}

/**
 * Updates the Date object for the 'next_deal' property of the given house.
 * Uses the 'deal_day' and 'deal_time' fields from 'settings'.
 * @param  {object} houseObj one of the elements in the 'houses' list
 * @return {void}          
 */
function updateNextDealDate(houseObj) {

	// Clear minutes/seconds/ms fields in the date
	houseObj.last_deal.setUTCMinutes(0);
	houseObj.last_deal.setUTCSeconds(0);
	houseObj.last_deal.setUTCMilliseconds(0);

	var lastDeal = houseObj.last_deal;
	var lastDealDay = lastDeal.getDay();
	var lastDealTime = lastDeal.getHours();
	var dayOffset = 0;
	/*
	 * Thank you based MDN.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime	
	 */
	switch (houseObj.settings.deal_day) {
		case 'Monday': {
			if ( lastDealDay == 1 ) {
				dayOffset = 7;
			}
			else if ( lastDealDay == 2 ) {
				dayOffset = 6;
			}
			else if ( lastDealDay == 3 ) {
				dayOffset = 5;
			}
			else if ( lastDealDay == 4 ) {
				dayOffset = 4;
			}
			else if ( lastDealDay == 5 ) {
				dayOffset = 3;
			}
			else if ( lastDealDay == 6 ) {
				dayOffset = 2;
			}
			else {
				dayOffset = 1;
			}
		}
		break;
		case 'Tuesday': {
			if ( lastDealDay == 1 ) {
				dayOffset = 1;
			}
			else if ( lastDealDay == 2 ) {
				dayOffset = 7;
			}
			else if ( lastDealDay == 3 ) {
				dayOffset = 6;
			}
			else if ( lastDealDay == 4 ) {
				dayOffset = 5;
			}
			else if ( lastDealDay == 5 ) {
				dayOffset = 4;
			}
			else if ( lastDealDay == 6 ) {
				dayOffset = 3;
			}
			else {
				dayOffset = 2;
			}
		}
		break;
		case 'Wednesday': {
			if ( lastDealDay == 1 ) {
				dayOffset = 2;
			}
			else if ( lastDealDay == 2 ) {
				dayOffset = 1;
			}
			else if ( lastDealDay == 3 ) {
				dayOffset = 7;
			}
			else if ( lastDealDay == 4 ) {
				dayOffset = 6;
			}
			else if ( lastDealDay == 5 ) {
				dayOffset = 5;
			}
			else if ( lastDealDay == 6 ) {
				dayOffset = 4;
			}
			else {
				dayOffset = 3;
			}
		}
		break;
		case 'Thursday': {
			if ( lastDealDay == 1 ) {
				dayOffset = 3;
			}
			else if ( lastDealDay == 2 ) {
				dayOffset = 2;
			}
			else if ( lastDealDay == 3 ) {
				dayOffset = 1;
			}
			else if ( lastDealDay == 4 ) {
				dayOffset = 7;
			}
			else if ( lastDealDay == 5 ) {
				dayOffset = 6;
			}
			else if ( lastDealDay == 6 ) {
				dayOffset = 5;
			}
			else {
				dayOffset = 4;
			}
		}
		break;
		case 'Friday': {
			if ( lastDealDay == 1 ) {
				dayOffset = 4;
			}
			else if ( lastDealDay == 2 ) {
				dayOffset = 3;
			}
			else if ( lastDealDay == 3 ) {
				dayOffset = 2;
			}
			else if ( lastDealDay == 4 ) {
				dayOffset = 1;
			}
			else if ( lastDealDay == 5 ) {
				dayOffset = 7;
			}
			else if ( lastDealDay == 6 ) {
				dayOffset = 6;
			}
			else {
				dayOffset = 5;
			}
		}
		break;
		case 'Saturday': {
			if ( lastDealDay == 1 ) {
				dayOffset = 5;
			}
			else if ( lastDealDay == 2 ) {
				dayOffset = 4;
			}
			else if ( lastDealDay == 3 ) {
				dayOffset = 3;
			}
			else if ( lastDealDay == 4 ) {
				dayOffset = 2;
			}
			else if ( lastDealDay == 5 ) {
				dayOffset = 1;
			}
			else if ( lastDealDay == 6 ) {
				dayOffset = 7;
			}
			else {
				dayOffset = 6;
			}
		}
		break;
		case 'Sunday': {
			if ( lastDealDay == 1 ) {
				dayOffset = 6;
			}
			else if ( lastDealDay == 2 ) {
				dayOffset = 5;
			}
			else if ( lastDealDay == 3 ) {
				dayOffset = 4;
			}
			else if ( lastDealDay == 4 ) {
				dayOffset = 3;
			}
			else if ( lastDealDay == 5 ) {
				dayOffset = 2;
			}
			else if ( lastDealDay == 6 ) {
				dayOffset = 1;
			}
			else {
				dayOffset = 7;
			}
		}
		break;
	}

	// We need to add 'dayOffset' to lastDeal's time, plus the hour offset
	//   hours_to_add = hours_at_new - hours_at_old
  	var hoursAtNew = parseInt(houseObj.settings.deal_time.split(' ')[0]);
	hourOffset = hoursAtNew - lastDeal.getHours();

	// Remember, .getTime() returns in milliseconds
	houseObj.next_deal = new Date( lastDeal.getTime() + (dayOffset * 24 + hourOffset) * 60 * 60 * 1000 );

	// Schedule the reroll deal
	setTimeout(function executeRerollRedeal(){
		dealFromRerolledCards(houseObj);
	}, houseObj.settings.reroll_window * 60 * 1000 );
}
module.exports.updateNextDealDate = updateNextDealDate;

/**
 * Returns true if we are within the time period where
 * re rolls are allowed.
 * @param  {[type]} req HTTP request
 * @return {boolean}     
 */
function withinRerollPeriod( req ) {
	var now = Date.now();
	var house = getHouseFromReq( req );
	if ( house !== null ) {
		var lastDealTime = house.last_deal.getTime();
		var rerollWindow = parseInt(house.settings.reroll_window.split(' ')[0]);

		// the reroll_window property is stored in minutes, not hours!
		var latestRerollTime = lastDealTime + (rerollWindow * 60 * 1000);
		if ( now <= latestRerollTime && now >= lastDealTime ) {
			return true;
		}
		else {
			return false;
		}
	}
	return false;
}
module.exports.withinRerollPeriod = withinRerollPeriod;