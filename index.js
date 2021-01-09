const { Telegraf } = require('telegraf');
const { Keyboard } = require('telegram-keyboard');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { enter, leave } = Stage;
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN, { polling: true });

const MovieSearchMenu = require('./movieSearchMenu.js');
const PeopleSearchMenu = require('./peopleSearchMenu.js');
const TvSearchMenu = require('./tvSearchMenu.js');
const Info = require('./infoMsg.js');

const ACTION_TYPES = {
    movieId: 'movieId',
	personId: 'personId',
	tvId : 'tvId',
    page: 'page',
	recommendMovies: 'recommendMovies',
	recommendTv: 'recommendTv',
	starredInMovies : 'starredInMovies',
	starredInTv : 'starredInTv',
	castMovies: 'castMovies',
	crewMovies: 'crewMovies',
	castTv : 'castTv',
	crewTv : 'crewTv',
	popularMovies : 'popularMovies',
	popularPeople : 'popularPeople',
	popularTv : 'popularTv'
}

const SEARCH_TYPES = {
	movies: 'movie',
	people: 'people',
	tvShows : 'tvShows'
}

let peopleInfos = [];
let movieInfos = [];
let tvInfos = [];
let searchMenus = [];

bot.start((ctx) => {
	const keyboard = Keyboard.make([
			['🎬 Search for Movies'], 
			['👤 Search for People'], 
			['📺 Search for TV Shows'],
		]);
	ctx.reply(`Hello, ${ctx.message.from.first_name} ${ctx.message.from.last_name}!
	
I could help you find Movies, TV Shows and People related to cinema. You could also see Recommendations, Cast and Crew for each Movie or TV Show and see Movies and TV Shows in creation of which certain Person participated.

You can start searching either by pressing buttons below or typing '/' and using specific commands`, keyboard.reply());
});	

const searchMovies = new Scene('movies');
const searchPeople = new Scene('people');
const searchTVShows = new Scene('tvShows');

const stage = new Stage([searchMovies, searchPeople, searchTVShows]);

bot.use(session()); 
bot.use(stage.middleware());

bot.hears('🎬 Search for Movies', (ctx) => ctx.scene.enter('movies'));
bot.hears('👤 Search for People', (ctx) => ctx.scene.enter('people'));
bot.hears('📺 Search for TV Shows', (ctx) => ctx.scene.enter('tvShows'));
searchMovies.command('movies', (ctx) => ctx.scene.enter('movies'));
searchMovies.command('people', (ctx) => ctx.scene.enter('people'));
searchMovies.command('tv', (ctx) => ctx.scene.enter('tvShows'));
searchPeople.command('movies', (ctx) => ctx.scene.enter('movies'));
searchPeople.command('people', (ctx) => ctx.scene.enter('people'));
searchPeople.command('tv', (ctx) => ctx.scene.enter('tvShows'));
searchTVShows.command('movies', (ctx) => ctx.scene.enter('movies'));
searchTVShows.command('people', (ctx) => ctx.scene.enter('people'));
searchTVShows.command('tv', (ctx) => ctx.scene.enter('tvShows'));
bot.command('movies', (ctx) => ctx.scene.enter('movies'));
bot.command('people', (ctx) => ctx.scene.enter('people'));
bot.command('tv', (ctx) => ctx.scene.enter('tvShows'));

bot.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log('Response time: %sms', ms);
});

bot.on('message', (ctx) => {
	const keyboard = Keyboard.make([
				['🎬 Search for Movies'], 
				['👤 Search for People'], 
				['📺 Search for TV Shows'],
			]);
	ctx.reply('⏺ Choose what type of content you want to search for', keyboard.reply());
});

searchMovies.enter((ctx) => {
	const keyboard = Keyboard.make([['⭐️ Popular Movies'],['Back ➡️']]);
	ctx.reply("🔎 Enter movie title:", keyboard.reply());
});
searchMovies.hears('Back ➡️', (ctx) => {
	ctx.scene.leave('movies');
	const keyboard = Keyboard.make([
				['🎬 Search for Movies'], 
				['👤 Search for People'], 
				['📺 Search for TV Shows'],
			]);
	ctx.reply('⏺ Choose what type of content you want to search for', keyboard.reply());
});
searchMovies.hears('⭐️ Popular Movies', (ctx) => {
	searchMenus.push(new MovieSearchMenu(ctx.update.message.chat.id, ACTION_TYPES.popularMovies));
	searchMenus[searchMenus.length - 1].displayMovies(1)
		.catch(() => searchMenus.pop());
});
searchPeople.enter((ctx) => {
	const keyboard = Keyboard.make([['⭐️ Popular People'],['Back ➡️']]);
	ctx.reply("🔎 Enter person's name:", keyboard.reply());
});
searchPeople.hears('Back ➡️', (ctx) => {
	ctx.scene.leave('people');
	const keyboard = Keyboard.make([
				['🎬 Search for Movies'], 
				['👤 Search for People'], 
				['📺 Search for TV Shows'],
			]);
	ctx.reply('⏺ Choose what type of content you want to search for', keyboard.reply());
});
searchPeople.hears('⭐️ Popular People', (ctx) => {
	searchMenus.push(new PeopleSearchMenu(ctx.update.message.chat.id, ACTION_TYPES.popularPeople));
	searchMenus[searchMenus.length - 1].displayPeople(1)
		.catch(() => searchMenus.pop());
});
searchTVShows.enter((ctx) => {
	const keyboard = Keyboard.make([['⭐️ Popular TV Shows'],['Back ➡️']]);
	ctx.reply("🔎 Enter TV show title:", keyboard.reply());
});
searchTVShows.hears('Back ➡️', (ctx) => {
	ctx.scene.leave('tvShows');
	const keyboard = Keyboard.make([
				['🎬 Search for Movies'], 
				['👤 Search for People'], 
				['📺 Search for TV Shows'],
			]);
	ctx.reply('⏺ Choose what type of content you want to search for', keyboard.reply());
});
searchTVShows.hears('⭐️ Popular TV Shows', (ctx) => {
	searchMenus.push(new TvSearchMenu(ctx.update.message.chat.id, ACTION_TYPES.popularTv));
	searchMenus[searchMenus.length - 1].displayTv(1)
		.catch(() => searchMenus.pop());
});

searchMovies.on('message', function(ctx){
	searchMenus.push(new MovieSearchMenu(ctx.update.message.chat.id,  ACTION_TYPES.movieId, ctx.message.text, ''));	
	searchMenus[searchMenus.length - 1].displayMovies(1)
		.catch(() => searchMenus.pop());
});
searchPeople.on('message', function(ctx){
	searchMenus.push(new PeopleSearchMenu(ctx.update.message.chat.id, ACTION_TYPES.personId, ctx.message.text, ''));	
	searchMenus[searchMenus.length - 1].displayPeople(1)
		.catch(() => searchMenus.pop());
});
searchTVShows.on('message', function(ctx){
	searchMenus.push(new TvSearchMenu(ctx.update.message.chat.id, ACTION_TYPES.tvId, ctx.message.text, ''));	
	searchMenus[searchMenus.length - 1].displayTv(1)
		.catch(() => searchMenus.pop());
});
bot.on('callback_query', async (ctx) => {
	const actionType = ctx.callbackQuery.data.substr(0, ctx.callbackQuery.data.indexOf(':'));
	const actionData = ctx.callbackQuery.data.substr(ctx.callbackQuery.data.indexOf(':') + 1);

	if(actionType === ACTION_TYPES.movieId) {
		movieInfos.push(new Info(ctx.update.callback_query.message.chat.id, actionData));
		movieInfos[movieInfos.length - 1].displayInfo(ACTION_TYPES.movieId);
	}
	else if(actionType === ACTION_TYPES.personId) {
		peopleInfos.push(new Info(ctx.update.callback_query.message.chat.id, actionData));
		peopleInfos[peopleInfos.length - 1].displayInfo(ACTION_TYPES.personId);
	}
	else if(actionType == ACTION_TYPES.tvId){
		tvInfos.push(new Info(ctx.update.callback_query.message.chat.id, actionData));
		tvInfos[tvInfos.length - 1].displayInfo(ACTION_TYPES.tvId);
	}
	else if(actionType === ACTION_TYPES.page) {
		let ind;
		const[page, searchType] = actionData.split(';');
		
		for(let i = 0; i < searchMenus.length; i++){
			if(ctx.update.callback_query.message.message_id == searchMenus[i].msgId){
				ind = i;
				break;
			}
		}
		if(searchMenus[ind].page != page){
			searchMenus[ind].page = page;
			if(searchType == SEARCH_TYPES.movies)
				searchMenus[ind].displayMovies(0);
			else if(searchType == SEARCH_TYPES.people)
				searchMenus[ind].displayPeople(0);
			else if(searchType == SEARCH_TYPES.tvShows)
				searchMenus[ind].displayTv(0);	
		}
	}
	else if(actionType == ACTION_TYPES.recommendMovies) {
		const[movieId, title] = actionData.split(';');
		searchMenus.push(new MovieSearchMenu(ctx.update.callback_query.message.chat.id, ACTION_TYPES.recommendMovies, title, movieId));	
		searchMenus[searchMenus.length - 1].displayMovies(1)
			.catch(() => searchMenus.pop());
	}
	else if(actionType == ACTION_TYPES.recommendTv) {
		const[tvId, title] = actionData.split(';');
		searchMenus.push(new TvSearchMenu(ctx.update.callback_query.message.chat.id, ACTION_TYPES.recommendTv, title, tvId));	
		searchMenus[searchMenus.length - 1].displayTv(1)
			.catch(() => searchMenus.pop());
	}
	else if(actionType == ACTION_TYPES.starredInMovies){
		const[personId, name] = actionData.split(';');
		
		searchMenus.push(new MovieSearchMenu(ctx.update.callback_query.message.chat.id, ACTION_TYPES.starredInMovies, name, personId));
		searchMenus[searchMenus.length - 1].displayMovies(1)
			.catch(() => searchMenus.pop());
	}
	else if(actionType == ACTION_TYPES.starredInTv){
		const[personId, name] = actionData.split(';');
		
		searchMenus.push(new TvSearchMenu(ctx.update.callback_query.message.chat.id, ACTION_TYPES.starredInTv, name, personId));
		searchMenus[searchMenus.length - 1].displayTv(1)
			.catch(() => searchMenus.pop());
	}
	else if(actionType == ACTION_TYPES.castMovies || actionType == ACTION_TYPES.crewMovies){
		const[movieId, title] = actionData.split(';');
		searchMenus.push(new PeopleSearchMenu(ctx.update.callback_query.message.chat.id, (actionType == ACTION_TYPES.castMovies ? ACTION_TYPES.castMovies : ACTION_TYPES.crewMovies), title, movieId));
		searchMenus[searchMenus.length - 1].displayPeople(1)
			.catch(() => searchMenus.pop());
	}
	else if(actionType == ACTION_TYPES.castTv || actionType == ACTION_TYPES.crewTv){
		const[tvId, title] = actionData.split(';');
		searchMenus.push(new PeopleSearchMenu(ctx.update.callback_query.message.chat.id, (actionType == ACTION_TYPES.castTv ? ACTION_TYPES.castTv : ACTION_TYPES.crewTv), title, tvId));
		searchMenus[searchMenus.length - 1].displayPeople(1)
			.catch(() => searchMenus.pop());
	}
});


bot.launch()
	.then(console.log('bot launched'));
	