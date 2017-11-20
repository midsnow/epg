import React, { PureComponent } from "react";
import Debug from 'debug';
import Gab from '../../../common/gab';
import { Styles } from '../../../common/styles';
import moment from 'moment';
import Table from '../../../common/components/table';
import { FlatButton, Divider, FontIcon, IconButton } from 'material-ui';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import {uniq, flatMap, keyBy, isObject, find as Find, filter as Filter } from 'lodash';
import Video from '../../../common/components/videoGeneric';
import VideoProgress from '../../../common/components/videoProgress';
import CopyToClipboard from 'react-copy-to-clipboard';
import RenderScheduled from './scheduled';

let debug = Debug('epg:app:pages:epg:components:channel');

export default class EPGChannel extends PureComponent {
	constructor( props, context ) {
		super( props, context )
				
		this.displayName = 'EPGChannel';
						
		this.state = {
			programID: Number(props.params.episode), 
			program: {},
			guide: [],
			boxHeight: props.desktop === 'xs' || props.desktop === 'sm' ? 'auto': props.window.height - 172,
			show: 'plot',
			wrapperHeight: props.desktop === 'xs' || props.desktop === 'sm' ? 'auto' : props.window.height - 122,
			anyChannel: -1, // any channel
			anyTime: 1, // anytime
			runType: 1, // new eps only,
			priority: 0,
			lifetime: -1,
			marginStart: 1,
			marginEnd: 1,
			maxRecordings: 5,			
			recordShow: 'scheduled',
		};
		
		this.changeProgram = this.changeProgram.bind(this);
		this.renderFutureEpisodes = this.renderFutureEpisodes.bind(this);
		this.show = this.show.bind(this);
		this.changeFutureEpisode = this.changeFutureEpisode.bind(this);
		this.getGuideProgram = this.getGuideProgram.bind(this);
		this.getGuideData = this.getGuideData.bind(this);
		this.getOtherPrograms = this.getOtherPrograms.bind(this);
		this.deleteTimer = this.deleteTimer.bind(this);
		this.deleteSeries = this.deleteSeries.bind(this);
		this.addTimer = this.addTimer.bind(this);
		this.addSeries = this.addSeries.bind(this);
		this.renderRecordScreen = this.renderRecordScreen.bind(this);
			
	}
	
	componentDidMount ( ) {
		if ( this.state.programID ) this.getGuideProgram( );
		if ( this.props.renderChannel ) this.getGuideData( this.props.renderChannel );
	}
	
	componentWillUnmount ( ) {
		delete this.state;
		delete this.guideData;
	}
	
	componentWillReceiveProps ( props ) {
		let state = {
			boxHeight: props.desktop === 'xs' || props.desktop === 'sm' ? 'auto' : props.window.height - 172,
			wrapperHeight: props.desktop === 'xs' || props.desktop === 'sm' ? 'auto' : props.window.height - 122,
		}
		if ( props.params.episode && ( props.params.episode !== this.state.programID ) ) {
			state.programID = Number(props.params.episode);
			//state.show = 'plot';
		}
		if ( props.renderChannel && ( this.state.guide.length === 0 || this.props.params.channel != props.params.channel ) ) {
			this.getGuideData( props.renderChannel ); 
		}
		debug( 'componentWillReceiveProps', state);
		this.setState( state, this.getGuideProgram );
	}
	
	getGuideData ( channel ) {
		debug( 'getGuideData', channel.stationID );
		this.props.Request({
			action: 'getGuideData',
			id: channel.stationID
		})
		.then(data => {
			debug('### got getGuideData ###', data);
			this._update = true;
			this.setState({
				guide: Filter( data.entries.groups[channel.stationID], v => ( Number(v.startTime) > moment().subtract(1, 'h').unix() ) ),
			});
		})
		.catch(error => {
			debug('ERROR from getGuideData', error)
		});
	}
	
	getGuideProgram ( programID ) {
		programID = programID || this.state.programID;
		debug(programID);
		this.props.Request({
			action: 'getGuideProgram',
			search: programID,
		})
		.then(data => {
			debug('### getGuideProgram ###', data);
			this._update = true;
			this.setState({
				program: data.program[0],
				futureEpisodes: [],
			}, () => { 
				this.getOtherPrograms( this.state.program.title.replace(/ *\([^)]*\) */g, "").trim(), 'title')
			} );
		})
		.catch(error => {
			debug('ERROR from getGuideProgram', error)
		});
	}
	
	getOtherPrograms ( search, key ) {
		this.props.Request({
			action: 'getGuideProgram',
			search,
			key
		})
		.then(data => {
			debug('### getOtherPrograms ###', data);
			this._update = true;
			this.setState({
				futureEpisodes: Filter( data.program, v => ( Number(v.startTime) > moment().unix() ) ),
			});
		})
		.catch(error => {
			debug('ERROR from getOtherPrograms', error)
		});
	}
	
	changeFutureEpisode ( rowId ) {
		let program = this.state.futureEpisodes[rowId];
		debug('changeFutureEpisode', this.state, program);
		let programID = program.id;
		this.props.goTo({ path: '/tv/channel/' + program.channel + '/' + programID, page: 'Program Info' } );
		window.scrollTo(0, 0);
	}
	
	renderFutureEpisodes ( program ) {
		let rows = [];
		let lastday = ''
		
		 this.state.futureEpisodes.forEach( ( s, k ) => {
			let day = moment.unix(s.startTime).format("dddd MMMM Do");
			if ( day != lastday ) {
				lastday = day;
				if ( rows.length === 0 ) {
					rows.push(<div style={{ zIndex: 1300, padding: 2, position: 'sticky', width: '100%', marginTop: 40,  top: 0, left: 0, backgroundColor: this.props.theme.baseTheme.palette.canvasColor, height: 25, fontSize: 14, fontWeight: 700, margin: '0 0 10 0' }} >{lastday}</div>);
				} else {
					rows.push(<div style={{ zIndex: 1300, padding: 2, position: 'sticky', width: '100%', marginTop: 40,  top: 0, left: 0, backgroundColor: this.props.theme.baseTheme.palette.canvasColor, height: 25, fontSize: 14, fontWeight: 700, margin: '30 0 20 0' }} >{lastday}</div>);
				}
			}
			
			let timer = <span />;
			let recordings = <span />;
			const isTimer = isObject( Find( this.props.timers, ( v ) => ( v.programID == s.programID  ) ) );
			const isRecorded = isObject( Find( this.props.recordings, [ 'programID', s.programID]  ) );
			if ( isTimer ) {
				timer = (
					<div style={{ marginTop: 2, width: 12, height: 12, textAlign: 'left'}}>
						<FontIcon className="material-icons"  color={Styles.Colors.red800} style={{cursor:'pointer', fontSize: 12}}  title="This progrram will be recorded">radio_button_checked</FontIcon>
					</div>
				);
			}
			if ( isRecorded ) {
				recordings = (
					<div style={{ marginTop: 2, width: 12, height: 12, textAlign: 'left'}}>
						<FontIcon className="material-icons"  color={Styles.Colors.limeA400} style={{cursor:'pointer', fontSize: 12}}  title="This program is recorded">play_circle_filled</FontIcon>
					</div>
				);
			}
			let icons = <div style={{ float: 'left', width: 5, height: 50 }} />;
			if ( isRecorded || isTimer ) {
				icons = (
					<div style={{ marginRight: 5,  float: 'right', width: 15, maxHeight: 50, textAlign: 'center'}}>
						{timer}
						{recordings}
					</div>
				);
			}
			const isNew = (s.repeat);
			let row = (
				<div style={{ position: 'relative', clear: 'both' }}>
					<span style={{ fontWeight: 700, fontSize: 14 }}>{moment.unix(s.startTime).format("LT")}</span> - <span style={{ fontWeight: 700, fontSize: 14 }}>{s.title}</span> 
					<div style={{  marginTop: 5, clear: 'both' }} >
						{ s.iconPath ? <img src={s.iconPath}  style={{ maxWidth: 48, float: 'left', margin: '0 5 0 0' }} /> : <span /> }
						{icons} 
						{s.plot}
					</div>
					<div className="clearfix" />
				</div> 
			);
			
			const tow = (<div 
					key={s.programID}
					onClick={( ) =>  {  
						this.changeFutureEpisode(k);
					}} 
					style={{ cursor: 'pointer', marginBottom: 5, padding: 5 }} 
				>
					{ row }
				</div>)
			
			rows.push(tow);
		});
		
		return (<div style={{ height: this.state.boxHeight - 50, overflow: 'auto' }} >{rows}</div>);
	}
	
	
	
	changeProgram ( rowId ) {
		let programID = this.state.guide[rowId].id;
		this.props.goTo({ path: '/tv/channel/' + this.props.renderChannel.channel + '/' + programID, page: 'Program Info' } );
		window.scrollTo(0, 0);
	}
	
	renderSchedule ( ) {
		let rows = [];
		let lastday = ''
		let g = this.state.guide;
		g.forEach( ( s, k ) => {
			let day = moment.unix(s.startTime).format("dddd MMMM Do");
			if ( day != lastday ) {
				lastday = day;
				if ( rows.length === 0 ) {
					rows.push(<div style={{ zIndex: 1300, padding: 2, position: 'sticky', width: '100%', marginTop: 40,  top: 0, left: 0, backgroundColor: this.props.theme.baseTheme.palette.canvasColor, height: 25, fontSize: 14, fontWeight: 700, margin: '0 0 10 0' }} >{lastday}</div>);
				} else {
					rows.push(<div style={{ zIndex: 1300, padding: 2, position: 'sticky', width: '100%', marginTop: 40,  top: 0, left: 0, backgroundColor: this.props.theme.baseTheme.palette.canvasColor, height: 25, fontSize: 14, fontWeight: 700, margin: '30 0 20 0' }} >{lastday}</div>);
				}
			}
			
			let timer = <span />;
			let series = <span />;
			let recordings = <span />;
			const isTimer = isObject( Find( this.props.timers, ( v ) => ( v.programID == s.programID  ) ) );
			const isSeries = isObject( Find( this.props.series, ( v ) => ( v.show == s.title || v.programID == s.programID  ) ) );
			const isRecorded = isObject( Find( this.props.recordings, [ 'programID', s.programID]  ) );
			if ( isTimer ) {
				timer = (
					<div style={{ marginTop: 2, width: 12, height: 12, textAlign: 'left'}}>
						<FontIcon className="material-icons"  color={Styles.Colors.red800} style={{cursor:'pointer', fontSize: 12}}  title="This progrram will be recorded">radio_button_checked</FontIcon>
					</div>
				);
			}
			if ( isSeries ) {
				series = (
					<div style={{  marginTop: 2, width: 12, height: 12, textAlign: 'left'}}>
						<FontIcon className="material-icons"  color={Styles.Colors.blue500} style={{cursor:'pointer', fontSize: 12}}  title="You have a Series Pass enabled for this program">fiber_dvr</FontIcon>
					</div>
				);
			}
			if ( isRecorded ) {
				recordings = (
					<div style={{ marginTop: 2, width: 12, height: 12, textAlign: 'left'}}>
						<FontIcon className="material-icons"  color={Styles.Colors.limeA400} style={{cursor:'pointer', fontSize: 12}}  title="This program is recorded">play_circle_filled</FontIcon>
					</div>
				);
			}
			let icons = <div style={{ float: 'left', width: 5, height: 50 }} />;
			if ( isRecorded || isSeries || isTimer ) {
				icons = (
					<div style={{ marginRight: 5,  float: 'right', width: 15, maxHeight: 50, textAlign: 'center'}}>
						{series} 
						{timer}
						{recordings}
					</div>
				);
			}
			const isNew = (s.repeat);
			let row = (
				<div style={{ position: 'relative', clear: 'both' }}>
					<span style={{ fontWeight: 700, fontSize: 14 }}>{moment.unix(s.startTime).format("LT")}</span> - <span style={{ fontWeight: 700, fontSize: 14 }}>{s.title}</span> 
					<div style={{ marginTop: 5, clear: 'both' }} >
						{ s.iconPath ? <img src={s.iconPath}  style={{ maxWidth: 48, float: 'left', margin: '0 5 0 0' }} /> : <span /> }
						{icons} 
						{s.plot}
					</div>
					<div className="clearfix" />
				</div> 
			);
			
			const tow = (<div 
					key={s.programID}
					onClick={( ) =>  {  
						this.changeProgram (k);
					}} 
					style={{ cursor: 'pointer', marginBottom: 5, padding: 5 }} 
				>
					{ row }
				</div>)
			
			rows.push(tow);
		});
		
		let style = this.props.idesktop > 1 ?  { height:  this.state.boxHeight + 15, overflow: 'auto' } : { };
		
		return (<div style={style} >{rows}</div>);
	}
	
	
	show ( what ) {
		this.setState( { show: what } );
	}
	
	doRequestCommand ( command ) {
		debug('doRequestComand', command);
	}
	
	renderWatchScreen ( program, recorded ) {
		/*	<Video source={'http://fire.snowpi.org:2777/alvin/play/hls/recentEpisodes/recentEpisodes.m3u8'} style={{ margin: 'auto'  }}  mimeType="video/mp4" autoPlay={true} poster={false}  onPlay={(e)=>{debug('Play',e)}} onError={(e)=>{debug('Error', e)}} mute={false} channel={{}} doRequestCommand={this.doRequestCommand} controls={true} />
			*/
		if ( !program.title ) {
			return ( <span>waiting for the program information</span> );
		}
		return <span />
		debug( program, recorded );
		const vidBox = (
			<div id="vid-box" style={{ position: 'relative', width: '100%' }} >
				<video id="videoPlayer" controls >
					<source src={recorded.url} type="video/mp4" />
				</video>
			</div>
		); 
		
		return vidBox; 
		
	}
	
	renderRecordScreen ( ) {
		
		const { program } = this.state;
		
		if ( !program.title ) {
			return ( <span>waiting for the program information</span> );
		}
		
		const recorded = Find( this.props.recordings,  ( v ) => { return v.programID == program.programID  }  );
		const isRecorded = isObject( recorded );
		
		const isTimer = isObject( Find( this.props.timers, ( v ) => { return v.programID == program.programID  } ) );
		
		const seriesO = Find( this.props.series, ( v ) => { 
			let byS = false;
			if( typeof v.show == 'string' && typeof program.title == 'string' ) {
				byS = ( v.show.replace(/ *\([^)]*\) */g, "").trim() == program.title.replace(/ *\([^)]*\) */g, "").trim() );
			}
			const byP = ( v.programID == program.programID );
			
			return ( byS || byP );
			  
		} )
		const isSeries = isObject( seriesO );
		debug('################', program, program.startTime, program.endTime, program.endTime < moment().unix(), moment().unix());
		let timer = (
			<FlatButton 
				title={ ( program.endTime < moment().unix() ) ? "Can not record a past program" : isTimer ? "This episode will be recorded.  Click to delete" : "Record This Episode" } 
				backgroundColor={isTimer ? Styles.Colors.red800 : 'initial'}
				hoverColor={Styles.Colors.red800}
				style={{ float: 'right', position: 'relative', textAlign: 'left'   }} 
				onClick={  isTimer ? this.deleteTimer : this.addTimer  } 
				icon={<FontIcon className="material-icons" children={'radio_button_checked'} />}
				label={ isTimer ? " Will be Recorded " : " Record Program " }
				disabled={ program.endTime < moment().unix() }
			/>
		);
		
		if ( isRecorded ) {
			timer = (
				<FlatButton 
					title={ "Watch This Episode" } 
					backgroundColor={this.props.theme.baseTheme.palette.accent3Color}
					hoverColor={Styles.Colors.limeA400}
					style={{ float: 'right', position: 'relative', textAlign: 'left'   }} 
					onClick={ e => ( this.show('watch') ) } 
					icon={<FontIcon className="material-icons" children={'play_circle_filled'} />}
					label={ " Watch Program " }
				/>
			);
		}
		
		let series = (
			<FlatButton 
				title={ isSeries ? "This program has a Series Pass.  Click to delete it." : "Create a Series Pass for this Program" } 
				style={{ float: 'left', position: 'relative', textAlign: 'left'   }} 
				onClick={ isSeries ? this.deleteSeries.bind(this, seriesO) : this.addSeries }
				icon={<FontIcon className="material-icons" children={'fiber_dvr'} />}
				backgroundColor={isSeries ? Styles.Colors.blue500 : 'initial'}
				hoverColor={Styles.Colors.blue500}
				label={ isSeries ? " Series Pass " : " Add a Series Pass " }
				
			/>
		);
		
		let list = Filter( this.props.timers, ( t ) => ( t.name.replace(/ *\([^)]*\) */g, "").trim() == program.title.replace(/ *\([^)]*\) */g, "").trim() ) );
		
		let innerList = (<div style={{ background: ( this.state.recordShow !== 'recorded' ? Styles.ColorMe(5, this.props.bgcolor).bgcolor : 'none')  }}>
			
			{ this.state.recordShow === 'recorded' ?
					<span />
				:
					list.length > 0 ?  
						<RenderScheduled fixedHeader={false} fixedFooter={false} height={this.state.boxHeight - 100}  futureEpisodes={this.state.futureEpisodes} program={program} list={list} channels={this.props.channels} onRowSelection={( i ) => {
								let programID = list[i].programID;
								let channel = Find( this.props.channels, (v) => ( v.channelId == list[i].channelId ));
								//debug(programID, list[i])
								if( channel ) this.props.goTo({ path: '/tv/channel/' + channel.channel + '/' + programID, page: 'Program Info' } );
						}} /> 
					: 
						<div style={{ padding: 10 }} children="No upcoming episodes are scheduled to be recorded." /> 
			}
		</div>);
		
		let records = Filter( this.props.recordings, ( t ) => ( t.show == program.title ) ); 
		
		let recordings = (<div style={{ background: ( this.state.recordShow === 'recorded' ? Styles.ColorMe(5, this.props.bgcolor).bgcolor : 'none')  }}>
			
			{ this.state.recordShow !== 'recorded' ?
					<span />
				:
					records.length > 0 ? 
						<RenderScheduled fixedHeader={false} fixedFooter={false} height={this.state.boxHeight - 100} program={program} list={records} channels={this.props.channels} futureEpisodes={this.state.futureEpisodes} onRowSelection={( i ) => {
				 				let programID = records[i].programID;
								let channel = Find( this.props.channels, (v) => ( v.channelId == records[i].channelId )); 
								//debug(programID, list[i])
								// if( channel ) this.props.goTo({ path: '/tv/channel/' + channel.channel + '/' + programID, page: 'Program Info' } );
						}} /> 
					: 
						<div  style={{ padding: 10 }}  children="No episodes are  recorded." />
			}
		</div>);
		
		return (<div style={{ paddingTop: 0 }}>
			{timer}{series}
			<div className="clearfix" style={{ paddingTop: 10 }} >
					<div style={{ padding: 5, margin: '10 0 0 0', width: '50%', float: 'left', cursor: 'pointer', background: ( this.state.recordShow !== 'recorded' ? Styles.ColorMe(5, this.props.bgcolor).bgcolor : 'none') }} onClick={()=>{this.setState({ recordShow: 'scheduled' })}}>Scheduled Recordings</div>
					<div style={{ padding: 5, margin: '10 0 0 0', width: '50%', float: 'left', cursor: 'pointer', background: ( this.state.recordShow === 'recorded' ? Styles.ColorMe(5, this.props.bgcolor).bgcolor : 'none'), textAlign: 'left' }}  onClick={()=>{this.setState({ recordShow: 'recorded' })}}>Recorded Programs</div>
					<div className="clearfix" />
					{ innerList  }
					{ recordings  }
			</div>
		</div>);
	}
	
	renderProgram ( ) {
		debug( 'renderProgram', this.state.program, this.props.recordings, Find( this.props.recordings, [ 'programID', this.state.program.programID]  ));
		let { programID, program } = this.state;
		
		if ( !programID ) {
			return ( <span>choose a program from the channel guide</span> );
		} else if ( !program.title ) {
			return ( <span>loading the program information</span> );
		}
				
		let recorded = Find( this.props.recordings, [ 'programID', program.programID]  );
		const isRecorded = isObject( recorded );
		const isTimer = isObject( Find( this.props.timers, ( v ) => ( v.programID == program.programID  ) ) );
		
		const isSeries = isObject( Find( this.props.series, ( v ) => { 
			let byS = false;
			if( typeof v.show === 'string' && typeof program.title === 'string' ) {
				byS = ( v.show.replace(/ *\([^)]*\) */g, "").trim() == program.title.replace(/ *\([^)]*\) */g, "").trim() );
			}
			const byP = ( v.programID == program.programID );
			return ( byS || byP );
			  
		} ) ); 
		
		let timerOrRecorded = ( isRecorded ) ?
			(<IconButton title={ "Available to watch" } style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('watch') ) } ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.props.theme.baseTheme.palette.accent3Color} >play_circle_filled</FontIcon></IconButton>)
		: 
			( isTimer ) ?
				(<IconButton title={"This episode will be recorded" } style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('record') ) } ><FontIcon className="material-icons" hoverColor={Styles.Colors.red400} style={{fontSize:'20px'}}  color={Styles.Colors.red800} >radio_button_checked</FontIcon></IconButton>)
			:
				(<IconButton title={ "Record Options" } style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('record') ) } ><FontIcon className="material-icons" hoverColor={Styles.Colors.red400} style={{fontSize:'20px'}}  color={this.state.show === 'record' ? Styles.Colors.limeA400 : this.props.theme.appBar.textColor || 'initial'} >radio_button_checked</FontIcon></IconButton>)

		const isNew = (moment.unix(program.firstAired).add(1, 'd').format("dddd M/D/YYYY") == moment.unix(program.startTime).format("dddd M/D/YYYY") || moment.unix(program.firstAired).format("dddd M/D/YYYY") == moment.unix(program.startTime).format("dddd M/D/YYYY"));		
		
		let cast = <span />
		if ( program.cast !== null ) {
			cast = program.cast.map( c => {
				return (<div 
					className="channelProgramCast" 
					children={ 
						<div> 
							{c.role} - <a href={"http://www.imdb.com/find?s=nm&exact=true&q=" + c.name.trim()} target="_blank" >{c.name}</a> {c.characterName ? `(${c.characterName})` : '' }
						</div> 
					} 
				/>);	
			});
		}
		let crew = <span />
		if ( program.crew !== null ) {
			crew = program.crew.map( c => {
				return (<div 
					className="channelProgramCast" 
					children={ 
						<div> 
							{c.role} - <a href={"http://www.imdb.com/find?s=nm&exact=true&q=" + c.name.trim()} target="_blank" >{c.name}</a>
						</div> 
					} 
				/>);	
			});
		}
		
		return (<div>
			
			<div style={{ height: '50px', marginTop: 5,  overflow: 'hidden' }}>	
				<div className="channelProgramTitle"  />
				<span>{!program.startTime ? '' : moment.unix(program.startTime).format(" LT dddd MMMM Do ")}</span>
				<br />
				{this.props.renderChannel.channel } -  { this.props.renderChannel.channelName }
			</div>
			
			<div className="col-xs-1" style={{ marginTop: 0, padding: 0, height: this.state.boxHeight }}>
				{ !isSeries ? <span /> : <IconButton title="This program has a Series Pass" style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('record') ) } ><FontIcon className="material-icons"  style={{fontSize:'20px'}}  color={Styles.Colors.blue500} >fiber_dvr</FontIcon></IconButton> }
				{ timerOrRecorded }
				<IconButton title="Plot" style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('plot') ) } ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.state.show === 'plot' ? Styles.Colors.limeA400 : this.props.theme.appBar.textColor || 'initial'} >description</FontIcon></IconButton>
				<IconButton title="Cast" style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('cast') ) } ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.state.show === 'cast' ? Styles.Colors.limeA400 : this.props.theme.appBar.textColor || 'initial'} >people</FontIcon></IconButton>
				<IconButton title="Other Showings" style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('other') ) } ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.state.show === 'other' ? Styles.Colors.limeA400 : this.props.theme.appBar.textColor || 'initial'} >live_tv</FontIcon></IconButton>
				
			</div>
			<div className="col-xs-11" style={{ paddingTop: 6, paddingBottom: 0, height: this.state.boxHeight, overflow: 'auto' }}>
				
				<div className="" style={{  overflow: 'auto', display: this.state.show === 'plot' ? 'block' : 'none' }}>
					
					
					<div style={{ marginTop: 0 }} className="channelProgramPlot"  >
						{ program.iconPath ? <img src={program.iconPath}  style={{ maxWidth: 100, float: 'left', margin: '5 10 5 0' }} /> : <span /> }
						{ program.plot }
					</div>
				</div>
				<div className="" style={{  overflow: 'auto', display: this.state.show === 'cast' ? 'block' : 'none' }}>
					<div className="channelProgramPeopleHeader">Cast</div>
					{cast}
					<div className="channelProgramPeopleHeader">Crew</div>
					{crew}
				</div>
				<div className="" style={{  overflow: 'auto', display: this.state.show === 'other' ? 'block' : 'none' }}>					
					<div style={{ padding: 5, margin: '7 0 0 0', background: Styles.ColorMe(5, this.props.bgcolor).bgcolor, width: '50%' }} >Upcoming Episodes</div>
						<div style={{ padding: 0, background: Styles.ColorMe(5, this.props.bgcolor).bgcolor, width: '100%' }} >
							{ this.state.show === 'other' ? this.renderFutureEpisodes( program ) : '' }
						</div>
				</div>
				<div className="" style={{  overflow: 'auto', display: this.state.show === 'record' ? 'block' : 'none' }}>					
					{ this.state.show === 'record' ? this.renderRecordScreen( program ) : '' }
					
				</div>
				<div className="" style={{  overflow: 'auto', display: this.state.show === 'watch' ? 'block' : 'none' }}>					
					{ this.state.show === 'watch' ? this.renderWatchScreen( program, recorded ) : '' }
					
				</div>
			</div>
		</div>)
	}
	
	render ( ) {
		const channel = this.props.renderChannel;
		const { program } = this.state;
		
		// quit if no program
		if ( !program || !channel ) {
			return (<span>No Program/Channel Ingormation Available</span>);
		}		
		
		const bgi = program.iconPath1 ? "url(" + program.iconPath + ") " : 'none';
		debug('render', this.props.renderChannel, this.state, bgi);
		
		const isNew = !program.repeat;	
		
		// add episode information
		let episode = <span />;
		if ( program.episode ) { 
			episode = (
				<div style={{ color: this.props.theme.baseTheme.palette.accent1Color, marginBottom: 5, overflow: 'hidden', fontSize: 14 }}>	
					<div className="channelProgramTitle" >
						{ isNew ? <FontIcon className="material-icons" color={this.props.theme.baseTheme.palette.accent3Color} style={{fontSize:'18px'}}   >fiber_new</FontIcon> : <span/>}  { program.episode   }
					</div>
				</div>
			);
		}
		
		let style = this.props.idesktop > 1 ?  { position: 'relative', height: this.state.wrapperHeight, overflow: 'hidden' } : { };
		
		return (
			<div style={{ 
				zIndex: 1500,
				backgroundColor: this.props.bgcolor,  
				backgroundImage:  bgi,
				backgroundSize: 'cover',
				position: 'absolute', 
				top: 0, 
				left: 0, 
				width: '100%', 
				height: '100%',
				
			}} >
				<div style={{ 
					display: 'flex',
					flexDirection: 'column',
					height: '100vh',
				}} >
					<div style={{
						    //display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							width: '100%',
							flexShrink: '0'
					}} >
						<div className="col-xs-3" style={{ height: 40 }} >
							<IconButton iconStyle={{fontSize: '36px'}} title="Return to Guide" style={{ position: 'absolute', top: 5, left: 5, textAlign: 'left', marginLeft: 0, padding: 0, width: 40, height: 40,   }} onClick={this.props.goBack} ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'40px'}}  color={this.props.theme.appBar.textColor || 'initial'} >arrow_back</FontIcon></IconButton>
						</div>
						<div className="col-xs-6" />
						<div className="col-xs-3" style={{ textAlign: 'right', padding: '10px 10px 0 0',  height: 40,  }}>
							<img style={{ maxWidth: 100 }} src={channel.iconPath} />
						</div>
					
						<div className="col-xs-12" style={{ marginTop: 10, color: 'white', paddingLeft: 15, textAlign: 'left', fontWeight: 400, fontSize: 32 }}>
							{ program.title }
							<br />
							<div style={{ fontSize: 16, marginTop: -4 }} >
								{episode}
							</div>
						</div>
					</div>
					
					<div  style={style}>
						<div  className="col-xs-12 col-sm-6" style={{ padding: '0 0 0 15px' }}  children={ this.renderProgram() } />
						<div  className="col-xs-12 col-sm-6" style={{ height: '100%', padding: '0 5px' }}  >
							<h5 style={{ padding: 0, marginBottom: 10 }} >Channel Guide</h5>
							{ this.renderSchedule() }
						</div>
					</div>
										
				</div>		
			</div>
		)
	}	
	
	addTimer ( ) {
		Gab.emit('confirm open', {
			title: "Record Single Program ",
			html: "Do you want to record " + this.state.program.title + "?",
			answer: ( yesno ) => { 
				if ( yesno) {
					
					Gab.emit('confirm open', { open: false });
					// add a new timer
					const { program } = this.state;
					const send = {
						anyChannel: this.props.renderChannel.channelId, // Channel ID
						startTime: program.startTime, // Start date and time of listing
						endTime: program.endTime,  // End date and time of listing
						title: program.title.replace(/ *\([^)]*\) */g, "").trim(), // name of listing
						channel:  this.props.renderChannel.channel,
						channelName:  this.props.renderChannel.channelName,
						//priority: obj.priority || 0,  //XBMc Priotiry (not used)
						//marginStart: obj.marginStart || 0, // pre padding in minutes
						//marginEnd: obj.marginEnd || 0,  // post padding in minutes
						//isRepeating: obj.isRepeating || 0,  // XBMC bIsRepeating (not used)
						programID: program.programID,  // ScheduleEntry ID
						//isSeries: 0, 
						//type: 0, 
						//anyChannel: program.channelId, 
						//anyTime: 0
					}
					debug('Record Program', send);
					this.props.setTimer( send ); 
				} else {
					Gab.emit('confirm open', { open: false });
				}
			},
			open: true,
			noText: 'Cancel',
			yesText: ' Record Program ', 
			noStyle: {
				backgroundColor: 'initial',
				labelStyle: {
					color: 'white',
				}
			},
			yesStyle: {
				backgroundColor: Styles.Colors.red800,
				labelStyle: {
					color: 'white',
				}
			}
		})
	}
	
	deleteTimer (  ) {
		const timer = Find( this.props.timers, ( v ) => { return v.programID == this.state.program.programID  } )
		Gab.emit('confirm open', {
			title: 'Scheduled Timer for ' + this.state.program.title + ' ',
			html: "Do you want to remove the scheduled timer for " + this.state.program.title + "?",
			answer: ( yesno ) => { 
				if ( yesno) {
					Gab.emit('confirm open', { 
						style: { backgroundColor: Styles.Colors.red300 },
						title: 'This is Permanent',
						open: true,
						html: "Are you positive? This will permanently remove the scheduled timer for "  + this.state.program.title,
						answer: ( yesno ) => { 
							Gab.emit('confirm open', { open: false });
							if ( yesno ) {
								const { program } = this.state;
								const send = {
									startTime: program.startTime, // Start date and time of listing
									title: program.title, // name of listing
									channel:  this.props.renderChannel.channel,
									channelName:  this.props.renderChannel.channelName,
									timerId: timer.timerId 
								}
								debug('Cancel Recording Program', send);
								this.props.deleteTimer( send ); 
							}
						},
						yesText: 'Permanently Delete', 
						noStyle: {
							backgroundColor: 'initial',
							labelStyle: {
								color: 'white',
							}
						},
						yesStyle: {
							backgroundColor: Styles.Colors.red800,
							labelStyle: {
								color: 'white',
							}
						}
					});
				} else {
					Gab.emit('confirm open', { open: false });
				}
			},
			open: true,
			noText: 'Cancel',
			yesText: ' DELETE Timer', 
			noStyle: {
				backgroundColor: 'initial',
				labelStyle: {
					color: 'white',
				}
			},
			yesStyle: {
				backgroundColor: Styles.Colors.red800,
				labelStyle: {
					color: 'white',
				}
			}
		})
	}
	
	addSeries ( ) {
		
		let { program, runType, anyChannel, anyTime } = this.state;
		
		let otherChannels = uniq(flatMap( this.state.futureEpisodes, o => o.channel));
		
		debug('otherchanels', otherChannels)
		
		Gab.emit('dialog open', {
			title: program.title,
			open: true,
			closeText: false,
			component: (
				<div className="" > 

					<div className="col-xs-12 col-sm-6" style={{ textAlign: 'right' }} >
						<select defaultValue={this.state.runType} style={{ padding: 5, textAlign: 'right', border: 'none', backgroundColor: this.props.theme.baseTheme.palette.canvasColor }}  onChange={e => ( this.setState({ runType: Number(e.target.value)}))} >
							<option value="1">Record New Episodes Only</option>
							<option value="0">Record New and Repeat Episodes</option>
							<option value="2">Record Live Showing Only</option>
						</select>
					</div>
					
					<div className="col-xs-12  col-sm-6" style={{ textAlign: 'right' }} >
						<select defaultValue={this.state.anyChannel} style={{padding: 5,  textAlign: 'right', border: 'none', backgroundColor: this.props.theme.baseTheme.palette.canvasColor }}  onChange={e => ( this.setState({ anyChannel: e.target.value}))} >
							<option value="-1">Record on any channel</option>
							{<option value={this.props.renderChannel.channelId} > {this.props.renderChannel.channelName} </option>}
						</select>
					</div>
					
					<div className="clearfix" style={{ marginBottom: 10 }} />
					
					<div className="col-xs-12  col-sm-6" style={{ textAlign: 'right', }} >
						<select defaultValue={this.state.anyTime}  style={{ padding: 5, textAlign: 'right', border: 'none', backgroundColor: this.props.theme.baseTheme.palette.canvasColor }}  onChange={e => ( this.setState({ anyTime: Number(e.target.value)}))} >
							<option value="1">Record at any time</option>
							<option value="0">Record at { moment.unix(this.state.program.startTime).format("h:mm a") } only.</option>
						</select>
					</div>
					<div className="col-xs-12  col-sm-6" style={{ textAlign: 'right' }} >
						<select defaultValue={this.state.priority} style={{ padding: 5, textAlign: 'right', border: 'none', backgroundColor: this.props.theme.baseTheme.palette.canvasColor }}  onChange={e => ( this.setState({ priority: Number(e.target.value)}))} >
							<option value="2">Low Priority </option>
							<option value="0" selected>Normal Priority</option>
							<option value="1" selected>High Priority</option>
						</select>
					</div>
					
					<div className="clearfix" style={{ marginBottom: 10 }} />
					
					<div className="col-xs-12  col-sm-6" style={{ textAlign: 'right' }} >
						
						<input type="text" id="aa" defaultValue={this.state.marginStart} style={{ padding: 5, marginRight: 10,  width: 30, textAlign: 'left',  border: 'none', borderBottom: '1px solid',  backgroundColor: this.props.theme.baseTheme.palette.canvasColor }}  onChange={e => ( this.setState({ marginStart: Number(e.target.value)}))} />
						<label htmlFor="aa">Pre Padding </label>
					</div>
					<div className="col-xs-12  col-sm-6" style={{ textAlign: 'right' }} >
						
						<input type="text" id="bb" defaultValue={this.state.marginEnd} style={{ padding: 5, marginRight: 10, width: 30, textAlign: 'left', border: 'none', borderBottom: '1px solid',  backgroundColor: this.props.theme.baseTheme.palette.canvasColor }}  onChange={e => ( this.setState({ marginEnd: Number(e.target.value)}))} />
						<label htmlFor="bb">Post Padding </label>	
					</div>
					
					<div className="clearfix" style={{ marginBottom: 10 }} />
					
					<div className="col-xs-12  col-sm-6" style={{ textAlign: 'right' }} >
						<select  defaultValue={this.state.lifetime} style={{padding: 5, textAlign: 'right',  border: 'none', backgroundColor: this.props.theme.baseTheme.palette.canvasColor }}  onChange={e => ( this.setState({ lifetime: e.target.value}))} >
							<option vlaue="-4">Not Set</option>
							<option value="-1" >Keep until space needed</option>
							<option value="-2">Keep until I watch</option>
							<option value="-3">Keep only latest recording</option>
							<option value="0">Keep until I delete</option>
							<option value="7">Keep for 1 week</option>
						</select>
					</div>
					<div className="col-xs-12  col-sm-6" style={{ textAlign: 'right' }} >
						<select defaultValue={this.state.maxRecordings} style={{ padding: 5, textAlign: 'right', border: 'none', backgroundColor: this.props.theme.baseTheme.palette.canvasColor }}  onChange={e => ( this.setState({ maxRecordings: Number(e.target.value)}))} >
							<option value="-1" >Keep as many as possible </option>
							<option value="1" >Keep 1 episode</option>
							<option value="2" >Keep 2 episodes</option>
							<option value="3" >Keep 3 episodes</option>
							<option value="4" >Keep 4 episodes</option>
							<option value="5" >Keep 5 episodes</option>
							<option value="6" >Keep 6 episodes</option>
							<option value="7" >Keep 7 episodes</option>
							<option value="8" >Keep 8 episodes</option>
							<option value="9" >Keep 9 episodes</option>
							<option value="10" >Keep 10 episodes</option>
						</select>
					</div>
					
					<div className="clearfix" style={{ marginBottom: 20 }} />
					
					<div >
						<FlatButton 
							title=" Add Series Pass " 
							//backgroundColor={Styles.Colors.blue500}
							hoverColor={Styles.Colors.blue500}
							style={{ float: 'right', position: 'relative', textAlign: 'left'   }} 
							onClick={  () => {
								
								let send = {
									startTime: program.startTime, // Start date and time of listing
									endTime: program.endTime,  // End date and time of listing
									title: program.title.replace(/ *\([^)]*\) */g, "").trim(), // name of listing
									//channel:  this.props.renderChannel.channel,
									//channelName:  this.props.renderChannel.channelName,
									priority: this.state.priority,  //priority
									marginStart: this.state.marginStart, // pre padding in minutes 
									marginEnd: this.state.marginEnd,  // post padding in minutes
									isRepeating: 1,  // series bool
									programID:  program.programID,  // ScheduleEntry ID
									lifetime: this.state.lifetime,  //lifetime -1 default
									runType: this.state.runType, // the type of episodes to record (0->all, 1->new, 2->live)
									anyChannel: this.state.anyChannel, // whether to rec series from ANY channel 0/-1 true / false
									anyTime: this.state.anyTime, // whether to rec series at ANY time 0/-1 true / false
									maxRecordings: this.state.maxRecordings, // whether to rec series at ANY time 0/-1 true / false 
									//search: (this.state.anyChannel !== this.props.renderChannel.channelId  && this.state.anyChannel !== -1) ? program.title : 0,
									//isKeyword:  (this.state.anyChannel !== this.props.renderChannel.channelId  && this.state.anyChannel !== -1) ? 1 : 0
								}
								debug('send', send, this.state)
								// add a new timer
								this.props.setTimer(send); 
								Gab.emit('dialog open', { open: false });
							} } 
							icon={<FontIcon className="material-icons" children={'fiber_dvr'} />}
							label={ " Add Series Pass " }
						/>
						<FlatButton 
							title=" Cancel " 
							//backgroundColor={Styles.Colors.blue500}
							//hoverColor={Styles.Colors.red800}
							style={{ float: 'left', position: 'relative', textAlign: 'left' , marginLeft: 15  }} 
							onClick={  () => ( Gab.emit('dialog open', { open: false }) ) } 
							label={ " Cancel " }
						/>
					</div>
				</div>
			)
		})
	}
	
	handleFormElement = function(field, e) {
		var nextState = {}
		nextState[field] = Number(e.target.value);
		debug('Change types', nextState );
		this.setState(nextState);
	}
	
	deleteSeries ( series ) { 
		Gab.emit('confirm open', {
			title:  'Season Pass for ' + series.name,
			html: "Do you want to remove the Season Pass for " + series.name + "?  This will also delete all scheduled recordings.",
			answer: ( yesno) => { 
				if ( yesno) {
					Gab.emit('confirm open', { 
						style: { backgroundColor: Styles.Colors.red300 },
						title: 'This is Permanent',
						open: true,
						html: "Are you positive? This will permanently remove the Season Pass for "  + series.name + ' and all scheduled recordings.  Recorded episodes will not be deleted.',
						answer: ( yesno ) => { 
							Gab.emit('confirm open', { open: false });
							if ( yesno ) {
								const send = {
									title: series.showName, // name of listing
									timerId: series.timerId,
									showName: series.showName,
									show: series.show
								}
								debug('Cancel Season Pass', send);
								this.props.deleteSeries( send ); 
							}
						},
						yesText: 'Remove Season Pass', 
						noStyle: {
							backgroundColor: 'initial',
							labelStyle: {
								color: 'white',
							}
						},
						yesStyle: {
							backgroundColor: Styles.Colors.red800,
							labelStyle: {
								color:  'white',
							}
						}
					});
				} else {
					Gab.emit('confirm open', { open: false });
				}
			},
			open: true,
			noText: 'Cancel',
			yesText: ' DELETE Season Pass', 
			noStyle: {
				backgroundColor: 'initial',
				labelStyle: {
					color: 'white',
				}
			},
			yesStyle: {
				backgroundColor:Styles.Colors.red800,
				labelStyle: {
					color:   'white',
				}
			}
		})
	}
	
	
}


