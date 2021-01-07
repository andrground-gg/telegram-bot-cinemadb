const { Telegraf } = require('telegraf');
require('dotenv').config();
const fetch = require('node-fetch');
const { Keyboard, Key } = require('telegram-keyboard');
const { callback } = Key;
const bot = new Telegraf(process.env.BOT_TOKEN);

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

function SearchMenu(fetchURL, page) {
	this.page = page;
	this.fetchURL = fetchURL;
	
	this.createMenu = async function(searchType, cast = 0, crew = 0){

		let actualPage = (this.page % 1 ? this.page - 0.5 : this.page);
		let list = [], listCast = [], listCrew = [], listCopy, listCopyCrew, listCopyCast;
		let pages, results;
		let totalPagesExist; 
		await fetch(this.fetchURL, { headers: { 'Content-Type':'application/json' }})
				.then((res) => res.json())
				.then((data) => {
					if(data.total_pages != undefined){
						pages = data.total_pages;
						fakePages = (data.total_results / 20 - Math.floor(data.total_results/20) > 0.5? pages * 2 : pages * 2 - 1);
						list = data.results;
						totalPagesExist = 1;
					}
					else{
						if(cast && crew){
							listCast = data.cast;
							listCrew = data.crew;
							listCopyCrew = listCrew;
							listCopyCast = listCast;
							
							listCrew = listCrew.filter((item, index, self) => 
								index == self.findIndex((t) => t.id == item.id));
							listCast = listCast.filter((item, index, self) => 
								index == self.findIndex((t) => t.id == item.id));
							list = listCast.concat(listCrew);
						}
						else if(cast) {
							list = data.cast;
							list = list.filter((item, index, self) => 
								index == self.findIndex((t) => t.id == item.id));
							listCopy = list;
						}
						else if(crew) {
							list = data.crew;
							list = list.filter((item, index, self) => 
								index == self.findIndex((t) => t.id == item.id));
							listCopy = list;
						}

						pages = parseInt(list.length / 20) + (list.length % 20 == 0? 0 : 1);
						fakePages = (list.length / 20 - Math.floor(list.length/20) > 0.5? pages * 2 : pages * 2 - 1);
						if(cast && crew){
							list.sort((a,b) => {
								if(a.popularity < b.popularity)
									return 1;
								else if(a.popularity > b.popularity)
									return -1;
								return 0;
							});
						}
						totalPagesExist = 0;
					}	
				})
				.catch((err) => console.log(err));
		if(list == false){
			throw('Exception');
		}
		
		let fakePage = (this.page % 1 ? actualPage * 2 : actualPage * 2 - 1);
		let reply = [];
		for(let i = (totalPagesExist ? (this.page % 1 ? 10 : 0) : (fakePage-1) * 10); i < (totalPagesExist ? (this.page % 1 ? 20 : 10) : (fakePage-1) * 10 + 10) && i < list.length; i++){
			if(searchType == SEARCH_TYPES.movies){
				let additionalInfo = '';
				if(cast && crew){
					let jobs = listCopyCrew.filter(item => item.id == list[i].id && list[i].job != undefined).map(a => a.job);
					let roles = listCopyCast.filter(item => item.id == list[i].id && list[i].character != undefined).map(a => a.character);
					if(jobs == ''){
						roles = roles.filter(a => a != '');
						if(roles != false)
							additionalInfo = ' (Cast) | ' + roles.join(', ');
						else 
							additionalInfo = ' (Cast)';
					}
					else
						additionalInfo = ' (Crew) | ' + jobs.join(', ');
				} 
				reply[i] = callback(list[i].title + (list[i].release_date == '' || list[i].release_date == undefined ? '' : ' (' + list[i].release_date.substr(0, 4) + ')') + additionalInfo, ACTION_TYPES.movieId + ':' + list[i].id);
			}
			else if(searchType == SEARCH_TYPES.people){
				if(cast){
					if(list[i].character != undefined)
						reply[i] = callback(list[i].name + ' | ' + list[i].character, ACTION_TYPES.personId + ':' + list[i].id);
					else{
						let roles = list[i].roles.map(a => a.character);
						reply[i] = callback(list[i].name + ' | ' + roles.join(', '), ACTION_TYPES.personId + ':' + list[i].id);
					}
				}
				else if(crew){
					let jobs;
					if(list[i].job != undefined)
						jobs = listCopy.filter(item => item.id == list[i].id).map(a => a.job);
					else
						jobs = list[i].jobs.map(a => a.job);
					reply[i] = callback(list[i].name + ' | ' + jobs.join(', '), ACTION_TYPES.personId + ':' + list[i].id);
				}
				else
					reply[i] = callback(list[i].name, ACTION_TYPES.personId + ':' + list[i].id);
			}
			else if(searchType == SEARCH_TYPES.tvShows){
				let additionalInfo = '';
				if(cast && crew){
					let jobs = listCopyCrew.filter(item => item.id == list[i].id && list[i].job != undefined).map(a => a.job);
					let roles = listCopyCast.filter(item => item.id == list[i].id && list[i].character != undefined).map(a => a.character);
					if(jobs == ''){
						roles = roles.filter(a => a != '');
						if(roles != false)
							additionalInfo = ' (Cast) | ' + roles.join(', ');
						else 
							additionalInfo = ' (Cast)';
					}
					else
						additionalInfo = ' (Crew) | ' + jobs.join(', ');
				}
				reply[i] = callback(list[i].name + (list[i].first_air_date == '' || list[i].first_air_date == undefined ? '' : ' (' + list[i].first_air_date.substr(0, 4) + ')') + additionalInfo, ACTION_TYPES.tvId + ':' + list[i].id);
			}
		};
		const kb1 = Keyboard.make(reply, {columns: 1});
		
		let pagesKeyboard = [];
		let i;
		
		
		switch(fakePage){
			case 1: i = 1; break;
			case 2: i = 0; break;
			case fakePages - 1: i = -2; break;
			case fakePages: i = -3; break;
			default: i = -1;
		}
		
		if(fakePages > 5) {
			pagesKeyboard.push(callback((fakePage == 1 ? '·' + 1 + '·' : (fakePage + i != 2 ? '⊴ ' + 1 : 1)), ACTION_TYPES.page + ':' + 1 + ';' + searchType));
			while(pagesKeyboard.length < 4 && pagesKeyboard.length < fakePages-1) {
				let destinationPage = parseFloat(this.page) + 0.5 * i;
				//' ⊳'
				if(fakePage + i == fakePage)
					pagesKeyboard.push(callback( '·' + parseInt(fakePage + i) + '·',  ACTION_TYPES.page + ':' + destinationPage + ';' + searchType));
				else if(pagesKeyboard.length == 1 && fakePage + i != 2)
					pagesKeyboard.push(callback('⊲ ' + parseInt(fakePage + i), ACTION_TYPES.page + ':' + destinationPage + ';' + searchType));
				else if(pagesKeyboard.length == 3 && fakePage + i != fakePages - 1)
					pagesKeyboard.push(callback(fakePage + i + ' ⊳', ACTION_TYPES.page + ':' + destinationPage + ';' + searchType));
				else
					pagesKeyboard.push(callback(fakePage + i, ACTION_TYPES.page + ':' + destinationPage + ';' + searchType));			
				i++;			
			}
			destinationPage = fakePages / 2 + 0.5;
			pagesKeyboard.push(callback((fakePage == fakePages ? '·' + fakePages + '·' : (fakePage + i != fakePages ? fakePages + ' ⊵': fakePages)), ACTION_TYPES.page + ':' + destinationPage + ';' + searchType));
		}
		else if(fakePages != 1){
			i = 0;
			while(pagesKeyboard.length < fakePages){
				let destinationPage = 1 + 0.5 * i;
				pagesKeyboard.push(callback((1 + i == fakePage ? '·' + parseInt(1 + i) + '·': 1 + i), ACTION_TYPES.page + ':' + destinationPage + ';' + searchType));
				i++;
			}
		}
		
		let keyboard, kb2;
		if(fakePages != 1) {
			kb2 = Keyboard.make(pagesKeyboard);
			keyboard = Keyboard.combine(kb1, kb2);
		}
		else
			keyboard = kb1;
		
		return keyboard;	
	}
}

module.exports = SearchMenu;