const { Telegraf } = require('telegraf');
require('dotenv').config();
const { Keyboard} = require('telegram-keyboard');
const bot = new Telegraf(process.env.BOT_TOKEN);

const SearchMenu = require('./searchMenu.js');

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

function MovieSearchMenu(chatId, actionType, query = '', contentId = '') {
	this.page = 1;
	this.chatId = chatId;
	this.msgId = '';
	this.query = query;
	this.contentId = contentId;
	this.actionType = actionType;
	
	this.displayMovies = async function(newMsg){
		try {
			
			let actualPage = (this.page % 1 ? this.page - 0.5 : this.page);
			let moviesURL;
			let cast = 0;
			let crew = 0;
			let msg = ''
			if(this.actionType == ACTION_TYPES.movieId){
				moviesURL = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.API_KEY}&language=en-US&query=${encodeURIComponent(this.query)}&page=${actualPage}&include_adult=false`;
				msg = `▶️ Movies ➡️ "${this.query}":`;
			}
			else if(this.actionType == ACTION_TYPES.recommendMovies){
				moviesURL = `https://api.themoviedb.org/3/movie/${this.contentId}/recommendations?api_key=${process.env.API_KEY}&language=en-US&page=${actualPage}`;
				msg = `▶️ Recommendations ➡️ "${this.query}":`;
			}
			else if(this.actionType == ACTION_TYPES.starredInMovies){
				cast = 1;
				crew = 1;
				moviesURL = `https://api.themoviedb.org/3/person/${this.contentId}/movie_credits?api_key=${process.env.API_KEY}&language=en-US`;
				msg = `▶️ Movies ➡️ ${this.query}`
			}
			else if(this.actionType == ACTION_TYPES.popularMovies){
				moviesURL = `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.API_KEY}&language=en-US&page=${actualPage}`;
				msg = `▶️ Popular Movies`;
			}
			
			let menu = new SearchMenu(moviesURL, this.page);
			const keyboard = await menu.createMenu(SEARCH_TYPES.movies, cast, crew);
			
			if(newMsg){
				bot.telegram.sendMessage(this.chatId, msg, keyboard.inline()).then(m => this.msgId = m.message_id);
			}
			else {
				bot.telegram.editMessageText(this.chatId, this.msgId, undefined, msg, keyboard.inline());
			}

		} catch(exception) {
			if(this.actionType == ACTION_TYPES.movieId)
				msg = `❌ No movies found matching "${this.query}"`;
			else if(this.actionType == ACTION_TYPES.recommendMovies)
				msg = `❌ No recommended movies found for "${this.query}"`;
			else if(this.actionType == ACTION_TYPES.starredInMovies)
				msg = `❌ No movies found in which ${this.query} starred`;
			else if(this.actionType == ACTION_TYPES.popularMovies)
				msg = `❌ No popular movies found`;
			bot.telegram.sendMessage(this.chatId, msg);
			return new Promise((resolve, reject) => {
				reject(this.msgId);
			})
		}
	}
}

module.exports = MovieSearchMenu;