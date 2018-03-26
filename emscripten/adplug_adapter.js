/*
 adplug_adapter.js: Adapts AdPlug backend to generic WebAudio/ScriptProcessor player.
 
 version 1.0
 
 	Copyright (C) 2015 Juergen Wothke

 LICENSE
 
 This library is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 2.1 of the License, or (at
 your option) any later version. This library is distributed in the hope
 that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public
 License along with this library; if not, write to the Free Software
 Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301 USA
*/
AdPlugBackendAdapter = (function(){ var $this = function () { 
		$this.base.call(this, backend_AdPlug.Module, 2);
		
		if (!backend_AdPlug.Module.notReady) {
			// in sync scenario the "onRuntimeInitialized" has already fired before execution gets here,
			// i.e. it has to be called explicitly here (in async scenario "onRuntimeInitialized" will trigger
			// the call directly)
			this.doOnAdapterReady();
		}		

	}; 
	// AdPlug's sample buffer contains 2-byte integer sample data (i.e. must be rescaled) 
	// of 2 interleaved channels
	extend(EmsHEAP16BackendAdapter, $this, {  
		getAudioBuffer: function() {
			var ptr=  this.Module.ccall('emu_get_audio_buffer', 'number');			
			// make it a this.Module.HEAP16 pointer
			return ptr >> 1;	// 2 x 16 bit samples			
		},
		getAudioBufferLength: function() {
			var len= this.Module.ccall('emu_get_audio_buffer_length', 'number') >>2;
			return len;
		},
		computeAudioSamples: function() {
			return this.Module.ccall('emu_compute_audio_samples', 'number');	
		},
		getMaxPlaybackPosition: function() { 
			return this.Module.ccall('emu_get_max_position', 'number');
		},
		getPlaybackPosition: function() {
			return this.Module.ccall('emu_get_current_position', 'number');
		},
		seekPlaybackPosition: function(pos) {
			this.Module.ccall('emu_seek_position', 'number', ['number'], [pos]);
		},

		mapUrl: function(filename) {			
			// used transform the "internal filename" to a valid URL
			var uri= this.mapFs2Uri(filename);
			var p= uri.indexOf("@");	// cut off "basePath" for "outside" files
			if (p >= 0) {
				uri= uri.substring(p+1);
			}
			return uri;
		},
		/*
		* Creates the URL used to retrieve the song file.
		*/
		mapInternalFilename: function(overridePath, basePath, filename) {
			// the problem is that in UADE there is only one "basePath" and this specifies 
			// where to look for *any* files, i.e. uade prefixes this path to whatever
			// files it is tying to load (config/music - doesn't matter), i.e. a correct 
			// outside URL CANNOT be passed through UADE without being messed up in the process
			
			// solution: use a special marker for "outside" URLs and later just substitute 
			// whatever garbage path information UADE is adding (see mapUrl() above)
			
			// map URL to some valid FS path (must not contain "//", ":" or "?")
			// input e.g. "@mod_proxy.php?mod=Fasttracker/4-Mat/bonus.mod" or
			// "@ftp://foo.com/foo/bar/file.mod" (should avoid name clashes)
			
			filename= this.mapUri2Fs("@" + filename);	// treat all songs as "from outside"

			var f= ((overridePath)?overridePath:basePath) + filename;	// this._basePath ever needed?

			if (this.modlandMode) this.originalFile= f;

			return f;
		},
		getPathAndFilename: function(fullFilename) {
			// input is path+filename combined: base for "registerFileData" & "loadMusicData"
			return ["", fullFilename];
		},
		mapCacheFileName: function (name) {
			return name;	// might need to use toUpper() in case there are inconsistent refs
		},
		mapBackendFilename: function (name) {
			var input= this.Module.Pointer_stringify(name);		
			return input;
		},
		registerFileData: function(pathFilenameArray, data) {			
			// input: the path is fixed to the basePath & the filename is actually still a path+filename
			var path= pathFilenameArray[0];
			var filename= pathFilenameArray[1];

			// MANDATORTY to move any path info still present in the "filename" to "path"
			var tmpPpathFilenameArray = new Array(2);	// do not touch original IO param			
			var p= filename.lastIndexOf("/");
			if (p > 0) {
				tmpPpathFilenameArray[0]= path + filename.substring(0, p);
				tmpPpathFilenameArray[1]= filename.substring(p+1);
			} else  {
				tmpPpathFilenameArray[0]= path;
				tmpPpathFilenameArray[1]= filename;
			}

			// setup data in our virtual FS (the next access should then be OK)
			return this.registerEmscriptenFileData(tmpPpathFilenameArray, data);
		},		
		loadMusicData: function(sampleRate, path, filename, data, options) {
			var ret = this.Module.ccall('emu_init', 'number', ['number', 'string', 'string'], 
														[sampleRate, path, filename]);

			if (ret == 0) {			
				var inputSampleRate = sampleRate;
				this.resetSampleRate(sampleRate, inputSampleRate); 
			}
			return ret;			
		},
		evalTrackOptions: function(options) {
			if (typeof options.timeout != 'undefined') {
				ScriptNodePlayer.getInstance().setPlaybackTimeout(options.timeout*1000);
			}
			var track= options.track;
			var ret= this.Module.ccall('emu_set_subsong', 'number', ['number'], [track]);
			return ret;
		},				
		teardown: function() {
			this.Module.ccall('emu_teardown', 'number');	// just in case
		},
		getSongInfoMeta: function() {
			return {title: String,
					author: String, 
					desc: String, 
					player: String, 
					speed: Number, 
					tracks: Number
					};
		},
		updateSongInfo: function(filename, result) {
			// get song infos
			var numAttr= 6;
			var ret = this.Module.ccall('emu_get_track_info', 'number');

			var array = this.Module.HEAP32.subarray(ret>>2, (ret>>2)+numAttr);
			result.title= this.Module.Pointer_stringify(array[0]);
			if (!result.title.length) result.title= filename.replace(/^.*[\\\/]/, '');
			result.author= this.Module.Pointer_stringify(array[1]);		
			result.desc= this.Module.Pointer_stringify(array[2]);
			result.player= this.Module.Pointer_stringify(array[3]);
			var s= parseInt(this.Module.Pointer_stringify(array[4]))
			result.speed= s;
			var t= parseInt(this.Module.Pointer_stringify(array[5]))
			result.tracks= t;
		}
	});	return $this; })();
	