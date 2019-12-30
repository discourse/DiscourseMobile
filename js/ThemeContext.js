import React from 'react';

export const themes = {
	light: {
		background: '#FFFFFF',
		buttonTextColor: '#FFFFFF',
		grayBackground: '#f5f8fa',
		grayBorder: '#ddd',
		grayUI: '#919191',
		grayUILight: '#e9e9e9',
		graySubtitle: '#919191',
		grayTitle: '#222',
		yellowUIFeedback: '#ffffa6',
		blueCallToAction: '#08c',
		blueUnread: '#0aadff',
		redDanger: '#ee512a',
		greenPrivateUnread: '#01a84c',
		barStyle: 'dark-content',
	},
	dark: {
		background: '#111',
		buttonTextColor: '#111',
		grayBackground: '#212121',
		grayBorder: '#343434',
		grayUI: '#666',
		grayUILight: '#232323',
		graySubtitle: '#666',
		grayTitle: '#999',
		yellowUIFeedback: '#403f30',
		blueCallToAction: '#0F82AF',
		blueUnread: '#0F82AF',
		redDanger: '#e45735',
		greenPrivateUnread: '#01a84c',
		barStyle: 'light-content',
	},
};

export const ThemeContext = React.createContext(themes.light);
