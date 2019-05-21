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

		this._scopeEnabled= false;
		
		if (!backend_AdPlug.Module.notReady) {
			// in sync scenario the "onRuntimeInitialized" has already fired before execution gets here,
			// i.e. it has to be called explicitly here (in async scenario "onRuntimeInitialized" will trigger
			// the call directly)
			this.doOnAdapterReady();
		}		
		this.codeMap= [	// codepage 437 used by PC DOS and MS-DOS
			0x0000,0x0001,0x0002,0x0003,0x0004,0x0005,0x0006,0x0007,
			0x0008,0x0009,0x000a,0x000b,0x000c,0x000d,0x000e,0x000f,
			0x0010,0x0011,0x0012,0x0013,0x0014,0x0015,0x0016,0x0017,
			0x0018,0x0019,0x001a,0x001b,0x001c,0x001d,0x001e,0x001f,
			0x0020,0x0021,0x0022,0x0023,0x0024,0x0025,0x0026,0x0027,
			0x0028,0x0029,0x002a,0x002b,0x002c,0x002d,0x002e,0x002f,
			0x0030,0x0031,0x0032,0x0033,0x0034,0x0035,0x0036,0x0037,
			0x0038,0x0039,0x003a,0x003b,0x003c,0x003d,0x003e,0x003f,
			0x0040,0x0041,0x0042,0x0043,0x0044,0x0045,0x0046,0x0047,
			0x0048,0x0049,0x004a,0x004b,0x004c,0x004d,0x004e,0x004f,
			0x0050,0x0051,0x0052,0x0053,0x0054,0x0055,0x0056,0x0057,
			0x0058,0x0059,0x005a,0x005b,0x005c,0x005d,0x005e,0x005f,
			0x0060,0x0061,0x0062,0x0063,0x0064,0x0065,0x0066,0x0067,
			0x0068,0x0069,0x006a,0x006b,0x006c,0x006d,0x006e,0x006f,
			0x0070,0x0071,0x0072,0x0073,0x0074,0x0075,0x0076,0x0077,
			0x0078,0x0079,0x007a,0x007b,0x007c,0x007d,0x007e,0x007f,
			0x00c7,0x00fc,0x00e9,0x00e2,0x00e4,0x00e0,0x00e5,0x00e7,
			0x00ea,0x00eb,0x00e8,0x00ef,0x00ee,0x00ec,0x00c4,0x00c5,
			0x00c9,0x00e6,0x00c6,0x00f4,0x00f6,0x00f2,0x00fb,0x00f9,
			0x00ff,0x00d6,0x00dc,0x00a2,0x00a3,0x00a5,0x20a7,0x0192,
			0x00e1,0x00ed,0x00f3,0x00fa,0x00f1,0x00d1,0x00aa,0x00ba,
			0x00bf,0x2310,0x00ac,0x00bd,0x00bc,0x00a1,0x00ab,0x00bb,
			0x2591,0x2592,0x2593,0x2502,0x2524,0x2561,0x2562,0x2556,
			0x2555,0x2563,0x2551,0x2557,0x255d,0x255c,0x255b,0x2510,
			0x2514,0x2534,0x252c,0x251c,0x2500,0x253c,0x255e,0x255f,
			0x255a,0x2554,0x2569,0x2566,0x2560,0x2550,0x256c,0x2567,
			0x2568,0x2564,0x2565,0x2559,0x2558,0x2552,0x2553,0x256b,
			0x256a,0x2518,0x250c,0x2588,0x2584,0x258c,0x2590,0x2580,
			0x03b1,0x00df,0x0393,0x03c0,0x03a3,0x03c3,0x00b5,0x03c4,
			0x03a6,0x0398,0x03a9,0x03b4,0x221e,0x03c6,0x03b5,0x2229,
			0x2261,0x00b1,0x2265,0x2264,0x2320,0x2321,0x00f7,0x2248,
			0x00b0,0x2219,0x00b7,0x221a,0x207f,0x00b2,0x25a0,0x00a0		
		];

	}; 
	// AdPlug's sample buffer contains 2-byte integer sample data (i.e. must be rescaled) 
	// of 2 interleaved channels
	extend(EmsHEAP16BackendAdapter, $this, {  
		enableScope: function(enable) {
			this._scopeEnabled= enable;
		},		
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
			var tmpPathFilenameArray = new Array(2);	// do not touch original IO param			
			var p= filename.lastIndexOf("/");
			if (p > 0) {
				tmpPathFilenameArray[0]= path + filename.substring(0, p);
				tmpPathFilenameArray[1]= filename.substring(p+1);
			} else  {
				tmpPathFilenameArray[0]= path;
				tmpPathFilenameArray[1]= filename;
			}

			// setup data in our virtual FS (the next access should then be OK)
			return this.registerEmscriptenFileData(tmpPathFilenameArray, data);
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
					tracks: Number,
					instruments: String
					};
		},
		cp437ToString: function(ptr) {	// msdos text to unicode..
		  var str = '';
		  while (1) {
			var ch = this.Module.getValue(ptr++, 'i8', true);
			if (!ch) return str;
			str += String.fromCharCode(this.codeMap[ch& 0xff]);
		  }
		},
		updateSongInfo: function(filename, result) {
			// get song infos
			var numAttr= 7;
			var ret = this.Module.ccall('emu_get_track_info', 'number');

			var array = this.Module.HEAP32.subarray(ret>>2, (ret>>2)+numAttr);
		//	result.title= this.Module.Pointer_stringify(array[0]);
			result.title= this.cp437ToString(array[0]);
			if (!result.title.length) result.title= filename.replace(/^.*[\\\/]/, '').split('.').slice(0, -1).join('.');
		//	result.author= this.Module.Pointer_stringify(array[1]);		
			result.author= this.cp437ToString(array[1]);		
			result.desc= this.Module.Pointer_stringify(array[2]);
			result.player= this.Module.Pointer_stringify(array[3]);
			var s= parseInt(this.Module.Pointer_stringify(array[4]))
			result.speed= s;
			var t= parseInt(this.Module.Pointer_stringify(array[5]))
			result.tracks= t;
			
			var instruments= "";
			var n = this.Module.ccall('emu_get_num_insts', 'number');			
			for (var i= 0; i<n; i++) {
				var txt = this.Module.ccall('emu_get_inst_text', 'number', ['number'], [i]);
				instruments+= this.cp437ToString(txt) + "<br>";
			}
			result.instruments= instruments;
		},
		// To activate the below output a song must be started with the "enableScope()"
		// At any given moment the below getters will then correspond to the output of getAudioBuffer
		// and what has last been generated by computeAudioSamples. 
		getNumberTraceStreams: function() {
			return this.Module.ccall('emu_number_trace_streams', 'number');			
		},
		getTraceStreams: function() {
			var result= [];
			var n= this.getNumberTraceStreams();

			var ret = this.Module.ccall('emu_trace_streams', 'number');			
			var array = this.Module.HEAP32.subarray(ret>>2, (ret>>2)+n);
			
			for (var i= 0; i<n; i++) {
				result.push(array[i] >> 2);	// pointer to int32 array
			}
			return result;
		},

		readFloatTrace: function(buffer, idx) {
			// input range is actually 16bit but with 9 or even 18 channels (which are added to create the final signal)
			// only a subrange is typically used (to avoid overflows) and the used scaling seems about OK to create 
			// graphs..
			return  this.Module.HEAP32[buffer+idx]/0x2000;		
		},
	});	return $this; })();
	